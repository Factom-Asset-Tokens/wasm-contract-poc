const crypto = require('crypto');
const util = require('./util');

const factomParams = {
    host: process.env.host,
    port: process.env.port
};

const {FactomCli, Entry, Chain} = require('factom');
const cli = new FactomCli(factomParams);

class Contract {
    constructor(id) {
        this._id = id;
        this._entries = new Map();
        this._init = false;
    }

    async init() {
        if (this._init) return;
        let entries = await cli.getAllEntriesOfChain(this._id);
        const first = entries.shift();
        entries = entries.map((entry) => {
            try {
                return Object.assign({entryhash: entry.hashHex()}, JSON.parse(entry.contentHex));
            } catch (e) {
                console.log("JSON Parse Error:", entry.hashHex())
            }
        });

        if (!first.extIds[0]) throw new Error('Contract extId not found');

        //load the WASM contract from the first entry's contract chain ID
        this._contract = Buffer.from(first.extIds[0], 'binary');

        //load the contract buffer into the WASM environment
        this._imports = util.getDefaultImports();
        this._wasm = await WebAssembly.instantiate(this._contract, this._imports);

        //inject imports into the WASM object
        this._wasm.imports = this._imports;

        //apply the state changes in order from the entries
        const self = this;
        entries.forEach(function (entry) {
            const func = entry.func;
            const args = entry.args;

            try {
                const result = self._wasm.instance.exports[func](...args);

                //store result and valid function call in memory for later
                self._entries.set(entry.entryhash, Object.assign(entry, {result}));
            } catch (e) {
                console.error("WASM Entry Error:", e.message);
            }
        });
        this._init = true;
    }

    //get a safe copy of the WASM instance & module running in the
    //contract at the current state
    async getWASM() {
        const imports = util.getDefaultImports();

        //copy memory (state) between current and copy instance
        const newMem = new Uint32Array(imports.env.memory.buffer);
        const oldMem = new Uint32Array(this._imports.env.memory.buffer);
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

        //If the call changed the state of the contract(hash of memory or table)
        //And writing is enabled then publish the call to Factom as it's a writing call
        /*if (write) {
            const entry = Entry.builder()
                .chainId(this._id)
                .content(JSON.stringify({func, args}), 'hex')
                .build();

            const commit = await cli.add(entry, process.env.es);
            const entryhash = commit.entryhash;
            return {result, entryhash}
        }*/

        return {result};
    }

    async getResult(entryhash) {
        await this.init();

        const entry = this._entries.get(entryhash);
        if (!entry) throw new Error("Entry not found in result set for contract ", this._id);
        return entry.result;
    }

    static async publish(contract) {
        //Check that this is a valid WASM contract & will run
        const wasm = await WebAssembly.instantiate(contract, util.getDefaultImports());

        const entry = Entry.builder()
            .extId(contract, 'binary') //salt the contract to make the deployment random
            .extId(crypto.randomBytes(16).toString('hex'), 'hex') //salt the contract to make the deployment random
            .build();

        const chain = new Chain(entry);
        await cli.add(chain, process.env.es);
        return chain.idHex;
    }
}

module.exports = Contract;