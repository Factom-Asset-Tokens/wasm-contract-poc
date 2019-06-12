const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const ContractPublication = require('../src/ContractPublication');

const testContractAddress = '898b44ab3c6cb365b7d3b6af32c4b68817a2d0eca39adf53c9e7b7df3017d25b';

describe('Contract', function () {
    this.timeout(10000);

    const Contract = require('../src/Contract');

    it('Publish A Contract', async function () {

        //get the simple addition example contract
        const contract = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        const publication = ContractPublication.builder(contract)
            .func('_add', ['number', 'number'], 'number')
            .func('_addRunning', ['number'], 'number')
            .build();

        //publish to Factom
        const result = await Contract.publish(publication);

        console.log('Published Contract!', result);

        assert.isString(result);
    });

    let contract;
    it('Load A Contract', async function () {
        contract = new Contract(testContractAddress);
        await contract.init();

        console.log('Loaded add.wasm contract!');
    });

    it('Get WASM Instance Copy', async function () {
        const wasm = await contract.getWASM();
        assert.isObject(wasm.imports);
        assert.instanceOf(wasm.instance, WebAssembly.Instance);
        assert.instanceOf(wasm.module, WebAssembly.Module);
    });

    it('Call Contract Function - Read Only', async function () {
        const call = await contract.call('_add', [1, 2]);
        assert.strictEqual(call.result, 3);
    });

    it('Call Contract Function - Write', async function () {
        const call = await contract.call('_addRunning', [3]);
        assert.isNumber(call.result);
    });

    it('Get Result Of Call', async function () {
        const result = await contract.getResult('a0dbead86874532ef4fc150ae4dd2590b7ed85541e50369225305bf3e7846d18');
        assert.strictEqual(result, 13);
    });
});