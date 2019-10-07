const crypto = require('crypto');
const {Entry, Chain} = require('factom');
const util = require('./util');

/*
*
* ABI Model
*
* -list function names
* -list function arguments & argument types
* -list function return types
*
* Possible values argument & return types:
* -'number' - An integer or floating point number
* -'boolean' - Either true or false
* -'string' - A string (character array)
*
* */

const types = [
    'number',
    'boolean',
    'string'
];

const publicationModel = {
    abi: {
        _add: {
            args: ['number', 'number'],
            returns: 'number'
        },
        _echo: {
            args: ['string'],
            returns: 'string'
        }
    }
};

class ContractPublicationBuilder {
    constructor(wasm) {
        //validate wasm binary
        if (!Buffer.isBuffer(wasm)) throw new Error('Argument wasm must be a WASM binary buffer');

        this._wasm = wasm;
    }

    func(name, args, returns) {
        //initialize ABI object if not already initialized
        if (!this._abi) this._abi = {};

        //check all argument and return types are valid
        if (!Array.isArray(args)) throw new Error('Argument args must be an array');
        args.forEach((arg) => {
            if (typeof arg !== 'string') throw new Error('Unknown argument type declared on function' + name);
            if (!types.includes(arg)) throw new Error('Unknown argument type declared on function' + name);
        });
        if (!types.includes(returns)) throw new Error('Unknown return type ' + returns + ' declared on func ' + name);

        this._abi[name] = {
            args,
            returns
        };

        return this;
    }

    build() {
        //Check the WASM binary is valid
        try {
            //check instantiation works
            const module = new WebAssembly.Module(this._wasm);
            const instance = new WebAssembly.Instance(module, util.getDefaultImports());

            //for each function declared in the ABI check it exists in the binary
            Object.keys(this._abi).forEach(function (func) {
                if (typeof instance.exports[func] !== 'function') throw new Error('Function \'' + func + '\' was not found in the WASM binary');
            });
        } catch (e) {
            throw new Error('Error loading contract WASM binary: ' + e.message);
        }
        return new ContractPublication(this);
    }
}


class ContractPublication {
    constructor(builder) {
        this._wasm = builder._wasm;
        this._abi = builder._abi;
    }

    getObject() {
        return {
            abi: this._abi
        }
    }

    getChain() {
        return new Chain(Entry.builder()
            .extId(this._wasm, 'binary') //salt the contract to make the deployment random
            .extId(crypto.randomBytes(16).toString('utf8'), 'utf8') //salt the contract to make the deployment random
            .content(JSON.stringify(this.getObject()), 'utf8')
            .build());
    }

    static builder(wasm) {
        return new ContractPublicationBuilder(wasm);
    }
}

module.exports = ContractPublication;