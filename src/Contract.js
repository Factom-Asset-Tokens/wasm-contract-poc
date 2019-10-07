const crypto = require('crypto');
const util = require('./util');

const factomParams = {
    host: process.env.host,
    port: process.env.port
};

const {FactomCli, Entry} = require('factom');
const cli = new FactomCli(factomParams);
const Walloc = require('walloc');
const metering = require('wasm-metering');

const ContractPublication = require('./ContractPublication');
const Void = require('./Void');

class Contract {
    constructor(id) {
        this._id = id;
        this._entries = new Map();
        this._init = false;

        //stats
        this.entryErrors = 0;
    }

    async init() {
        if (this._init) return;
        let entries = await cli.getAllEntriesOfChain(this._id);
        let first = entries.shift();
        entries = entries.map((entry) => {
            try {
                return Object.assign({entryhash: entry.hashHex()}, JSON.parse(entry.content.toString()));
            } catch (e) {
                console.log("JSON Parse Error:", entry.hashHex(), e.message)
            }
        });
        entries = entries.filter((entry) => entry !== undefined);

        //load the WASM contract from the first entry's contract chain ID
        if (!first.extIds[0]) throw new Error('Contract extId not found');
        this._contract = Buffer.from(first.extIds[0], 'binary');

        //validate publication entry
        const publication = JSON.parse(first.content.toString());

        //validate publication JSON
        //
        //

        this.abi = publication.abi;


        //load the contract buffer into the WASM environment
        const imports = util.getDefaultImports();

        //setup test gas function
        let gasUsed = 0;
        const gasLimit = 99999999;

        imports.metering = {
            usegas: (gas) => {
                gasUsed += gas;
                // console.log('GAS-', gasUsed);
                if (gasUsed > gasLimit) {
                    throw new Error('out of gas!')
                }
            }
        };

        //set up walloc - an way to help us allocate memory for complex params like strings & arrays
        const walloc = new Walloc({
            memory: imports.env.memory,
            getTotalMemory() {
                return imports.env.memory.buffer.byteLength;
            }
        });

        //inject metering into binary
        const meteredWasm = metering.meterWASM(this._contract, {
            meterType: 'i32'
        });

        this._wasm = await WebAssembly.instantiate(meteredWasm, imports);

        //inject walloc into the WASM object
        this._wasm.walloc = walloc;

        //inject imports into the WASM object
        this._wasm.imports = imports;

        //apply the state changes in order from the entries
        const self = this;
        entries.forEach(function (entry) {
            try {
                //get the result object of executing the entry
                const result = applyCall(self._wasm, self.abi, entry.func, entry.args);

                //store result and the valid function call in memory for later
                self._entries.set(entry.entryhash, result);
            } catch (e) {
                self.entryErrors++;
            }
        });
        // console.log("Loaded", entries.length, "State Changes");

        this._init = true;
    }

    //get a safe copy of the WASM instance & module running in the
    //contract at the current state
    async getWASM() {
        const imports = util.getDefaultImports();

        //setup test gas function
        let gasUsed = 0;
        const gasLimit = 99999999;

        imports.metering = {
            usegas: (gas) => {
                gasUsed += gas;
                // console.log('GAS-', gasUsed);
                if (gasUsed > gasLimit) {
                    throw new Error('Out of Gas!')
                }
            }
        };

        //inject metering into binary
        const meteredWasm = metering.meterWASM(this._contract, {
            meterType: 'i32'
        });

        const wasm = await WebAssembly.instantiate(meteredWasm, imports);

        //inject imports
        wasm.imports = imports;

        //copy memory (state) between current and copy instance
        const newMem = new Uint32Array(imports.env.memory.buffer);
        const oldMem = new Uint32Array(this._wasm.imports.env.memory.buffer);
        for (let i = 0; i < oldMem.length; i++) {
            newMem[i] = oldMem[i];
        }

        //set up & inject walloc
        wasm.walloc = new Walloc({
            memory: imports.env.memory,
            getTotalMemory() {
                return imports.env.memory.buffer.byteLength;
            }
        });

        return wasm;
    }

    async call(func, args, write = true) {
        await this.init();

        //attempt to make the call on a copy of the contract and return the result
        const wasm = await this.getWASM();

        //attempt to execute the call
        const result = applyCall(wasm, this.abi, func, args);

        //check if there was a state change in memory resulting from the call
        const delta = !util.bufferEqual(wasm.imports.env.memory.buffer, this._wasm.imports.env.memory.buffer);

        //If the call changed the state of the contract(memory)
        //And writing is enabled then publish the call to Factom as it's a writing call
        if (delta && write) {
            const entry = Entry.builder()
                .chainId(this._id)
                .extId(crypto.randomBytes(16).toString('utf8'), 'utf8')
                .content(JSON.stringify({func, args}), 'utf8')
                .build();

            await cli.add(entry, process.env.es);
            const entryhash = entry.hashHex();
            return {result, entryhash}
        }

        return {result};
    }

    async getResult(entryhash) {
        await this.init();

        const result = this._entries.get(entryhash);

        if (result === undefined) throw new Error("Entry not found in result set for contract " + this._id);

        return result;
    }

    static async publish(publication) {
        if (!publication instanceof ContractPublication) throw new Error("Argument publication must be an instance of ContractPublication");
        const chain = publication.getChain();
        await cli.add(chain, process.env.es);
        return chain.idHex;
    }
}

function applyCall(wasm, abi, func, args) {
    try {
        //evaluate ABI

        //check func is declared by ABI

        const abiFunc = abi[func];
        if (!abiFunc) throw new Error('Attempted to call function not specified in ABI: ' + func);

        //create a set for allocated param memory pointers(strings, arrays)
        //use a set because we don't want to free a pointer twice
        const pointers = new Set(); //set up a holder for pointers we create for params

        //evaluate args against args & types allowed by func
        //under-filling args is currently supported, e.x. calling fn(a,b,c) with just fin(a,b) is allowed
        for (let i = 0; i < args.length; i++) {
            if (!abiFunc.args[i]) throw new Error('Unexpected arg at index ' + i + ': ' + func + ' accepts ' + abiFunc.args.length + ' arguments');
            if (typeof args[i] !== abiFunc.args[i]) throw new Error('Arg at index ' + i + ': ' + func + ' accepts a ' + abiFunc.args[i] + ' not ' + args[i]);

            //if we get a string param we need to allocate some memory
            if (typeof args[i] === 'string') {
                //allocate a pointer for the string
                const pointer = wasm.walloc.malloc(args[i].length);

                //write the string into memory at the pointer
                util.writeString(wasm.imports.env.memory, args[i], pointer);

                //add the pointer to the pointer set
                pointers.add(pointers);

                //replace the argument with it's pointer representation before it's passed in
                args[i] = pointer;
            }
        }

        //call the function and get the resulting int, float, or pointer
        let result = wasm.instance.exports[func](...args);

        //if the result of the function is of type string get the value from the pointer that was returned
        if (abiFunc.returns === 'string') {
            pointers.add(result); //push the result pointer
            result = util.readString(new Uint8Array(wasm.imports.env.memory.buffer), result);
        } else if (abiFunc.returns === 'boolean') {
            result = Boolean(result).valueOf();
        }

        //free up all our param & result pointers after getting the end result
        pointers.forEach((pointer) => wasm.walloc.free(pointer));

        //if the function was void return type, classify it as such
        if (result === undefined) result = new Void();

        return result;
    } catch (e) {
        throw new Error("WASM Call Error:" + e.message);
    }
}

module.exports = Contract;