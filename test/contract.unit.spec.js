const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const ContractPublication = require('../src/ContractPublication');

describe('Contract', function () {
    this.timeout(10000);

    const Contract = require('../src/Contract');

    it('Publish A Contract', async function () {

        //get the simple addition example contract
        const contract = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        const publication = ContractPublication.builder(contract)
            .func('_add', ['number'], 'number')
            .build();

        //publish to Factom
        const result = await Contract.publish(publication);

        console.log('Published Contract!', result);

        assert.isString(result);
    });

    let contract;
    it('Load A Contract', async function () {
        contract = new Contract('56024e237fea9c145a8ddc438bc33eb0131173f8e7cabf8b8947992fe7acff5d');
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
        const call = await contract.call('_addRunning', [1]);
        assert.isNumber(call.result);

        console.log(call)
    });

    it('Get Result Of Call', async function () {
        const result = await contract.getResult('6222d9e9774823164ef74a1f09708af96ffc98e607750267cdac1676ef7cb25b');
        assert.strictEqual(result, 11);
    });
});