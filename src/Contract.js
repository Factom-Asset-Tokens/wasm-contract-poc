const crypto = require('crypto');
const util = require('./util');

const factomParams = {
    host: process.env.host,
    port: process.env.port
};

const {FactomCli, Entry, Chain} = require('factom');
const cli = new FactomCli(factomParams);

const {InteractiveReader} = require('factom-storage/src/read/InteractiveReader');
const reader = new InteractiveReader(factomParams);

const {InteractiveWriter} = require('factom-storage/src/write/InteractiveWriter');
const writer = new InteractiveWriter(factomParams);

class Contract {
    constructor(id) {
        this._id = id;
        this._entries = new Map();
        this._init = false;
    }

    async init() {
        if (this._init) return;
        let entries = await cli.getAllEntriesOfChain(this._id);
        entries = entries.map((entry) => {
            try {
                return Object.assign({entryhash: entry.hashHex()}, JSON.parse(entry.contentHex));
            } catch (e) {
                console.log("JSON Parse Error:", entry.hashHex())
            }
        });

        //validate the first entry (JOI)
        const first = entries.shift();

        //load the WASM contract from the first entry's contract chain ID
        const contract = await reader.read(first.chain);

        //load the contract buffer into the WASM environment
        this._wasm = await WebAssembly.instantiate(contract, util.getDefaultImports());
        this._exports = this._wasm.instance.exports;

        //apply the state changes in order from the entries
        const self = this;
        entries.forEach(function (entry) {
            const func = entry.func;
            const args = entry.args;

            try {
                const result = wasm.instance.exports[func](args);

                //store result and valid function call in memory for later
                self._entries.set(entry.entryhash, Object.assign(entry, {result}));
            } catch (e) {
                console.error("WASM Entry Error:", e.message);
            }
        });
        this._init = true;
    }

    async call(func, args, write = true) {
        await this.init();

        //attempt to make the call on a copy of the contract and return the result
        const wasm = await WebAssembly.instantiate(this._wasm);
        const result = wasm.instance.exports[func](args);

        //If the call changed the state of the contract(hash of memory or table)
        //And writing is enabled then publish the call to Factom as it's a writing call
        if (write) {
            const entry = Entry.builder()
                .chainId(this._id)
                .content(JSON.stringify({func, args}), 'hex')
                .build();

            const commit = await cli.add(entry, process.env.es);
            const entryhash = commit.entryhash;
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

    static async publish(contract) {
        //Check that this is a valid WASM contract & will run
        const wasm = await WebAssembly.instantiate(contract, util.getDefaultImports());

        //Store the WASM contract on Factom and get the resulting chain ID
        const commit = await writer.write(contract, process.env.es);
        const id = commit.chainId;

        const content = {
            chain: id,
            metadata: params.metadata
        };

        const entry = Entry.builder()
            .extId(crypto.randomBytes(16).toString('hex'), 'hex') //salt the contract to make the deployment random
            .content(JSON.stringify(content, 'hex'))
            .build();

        const chain = new Chain(entry);
        await cli.add(chain, process.env.es);
        return chain.idHex;
    }
}

module.exports = Contract;