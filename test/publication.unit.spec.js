const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

describe('ContractPublication Unit', function () {
    const ContractPublication = require('../src/ContractPublication');

    it('Model A Contract Publication', function () {

        //get the simple addition example contract
        const contractWasm = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        //declare the contract has an externally accessible function:
        //_add that takes in parameter 0 type number, and returns type number
        const publication = ContractPublication.builder(contractWasm)
            .func('_add', ['number'], 'number')
            .build();

        //validate the publication
        const pubObject = publication.getObject();
        assert.isObject(pubObject);
        assert.isObject(pubObject.abi);
        assert.isObject(pubObject.abi._add);
        assert.isArray(pubObject.abi._add.args);
        assert.lengthOf(pubObject.abi._add.args, 1);
        assert.strictEqual(pubObject.abi._add.args[0], 'number');
        assert.strictEqual(pubObject.abi._add.returns, 'number');
    });

    it('Check Errors', function () {
        //get the simple addition example contract
        const contractWasm = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        //Check submitting invalid WASM binary params
        assert.throws(() => ContractPublication.builder(Buffer.from('j1983f928j', 'binary'))
            .build());

        assert.throws(() => ContractPublication.builder("ABC")
            .build());

        //check invalid ABI function params
        assert.throws(() => ContractPublication.builder(contractWasm)
            .func('_add0', ['number'], 'number') //invalid func
            .build());

        assert.throws(() => ContractPublication.builder(contractWasm)
            .func('_add', ['meep'], 'number') //invalid arg type
            .build());

        assert.throws(() => ContractPublication.builder(contractWasm)
            .func('_add', "a", 'number') //invalid args array
            .build());

        assert.throws(() => ContractPublication.builder(contractWasm)
            .func('_add', ['meep'], 'yerp') //invalid return type
            .build());
    });
});