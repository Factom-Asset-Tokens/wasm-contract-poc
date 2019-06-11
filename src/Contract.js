const crypto = require('crypto');
const util = require('./util');

const factomParams = {
    host: process.env.host,
    port: process.env.port
};

const {FactomCli, Entry} = require('factom');
const cli = new FactomCli(factomParams);

const ContractPublication = require('./ContractPublication');

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
        this.abi = publication.abi;
        //validate publication
        //
        //

        //load the contract buffer into the WASM environment
        const imports = util.getDefaultImports();
        this._wasm = await WebAssembly.instantiate(this._contract, imports);

        //inject imports into the WASM object
        this._wasm.imports = imports;

        //apply the state changes in order from the entries
        const self = this;
        entries.forEach(function (entry) {
            const func = entry.func;
            const args = entry.args;

            try {
                //evaluate ABI

                //check func is allowed by ABI
                if (!self.abi[func]) throw new Error('Attempted to call function not specified in ABI ' + func);

                const abiFunc = self.abi[func];

                //evaluate args against args & types allowed by func
                for (let i = 0; i < args.length; i++) {
                    if (!abiFunc.args[i]) throw new Error('Unexpected arg at index ' + i + ': ' + func + ' accepts ' + abiFunc.args.length + ' arguments');
                    if (typeof args[i] !== abiFunc.args[i]) throw new Error('Arg at index ' + i + ': ' + func + ' accepts a ' + abiFunc.args[i]);
                }

                const result = self._wasm.instance.exports[func](...args);

                //store result and valid function call in memory for later
                self._entries.set(entry.entryhash, Object.assign(entry, {result}));
            } catch (e) {
                console.error("WASM Entry Error:", e.message);
                self.entryErrors++;
            }
        });
        console.log("Loaded", entries.length, "State Changes");

        this._init = true;
    }

    //get a safe copy of the WASM instance & module running in the
    //contract at the current state
    async getWASM() {
        const imports = util.getDefaultImports();

        //copy memory (state) between current and copy instance
        const newMem = new Uint32Array(imports.env.memory.buffer);
        const oldMem = new Uint32Array(this._wasm.imports.env.memory.buffer);
        for (let i = 0; i < oldMem.length; i++) {
            newMem[i] = oldMem[i];
        }

        const wasm = await WebAssembly.instantiate(this._contract, imports);
        wasm.imports = imports;
        return wasm;
    }

    async call(func, args, write = true) {
        await this.init();

        //attempt to make the call on a copy of the contract and return the result
        const wasm = await this.getWASM();
        const result = wasm.instance.exports[func](...args);

        //check if there was a state change in memory resulting from the call
        const delta = !util.bufferEqual(wasm.imports.env.memory.buffer, this._wasm.imports.env.memory.buffer);

        //If the call changed the state of the contract(memory)
        //And writing is enabled then publish the call to Factom as it's a writing call
        if (delta && write) {
            const entry = Entry.builder()
                .chainId(this._id)
                .extId(crypto.randomBytes(16).toString('hex'), 'hex')
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

        const entry = this._entries.get(entryhash);
        if (!entry) throw new Error("Entry not found in result set for contract ", this._id);
        return entry.result;
    }

    static async publish(publication) {
        if (!publication instanceof ContractPublication) throw new Error("Argument publication must be an instance of ContractPublication");
        const chain = publication.getChain();
        await cli.add(chain, process.env.es);
        return chain.idHex;
    }
}

module.exports = Contract;