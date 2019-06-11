const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const ContractPublication = require('../src/ContractPublication');

const testContractAddress = '6064864b61046b1688e7c18441d0ab8f23ee0da39c6ec049dcd865b1ab586ad5';

describe('Contract', function () {
    this.timeout(10000);

    const Contract = require('../src/Contract');

    it('Publish A Contract', async function () {

        //get the simple addition example contract
        const contract = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        const publication = ContractPublication.builder(contract)
            .func('_add', ['number'], 'number')
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
        const call = await contract.call('_addRunning', [1]);
        assert.isNumber(call.result);

        console.log(call)
    });

    it('Get Result Of Call', async function () {
        const result = await contract.getResult('17be7c62bb3be740a16c8bc7487d7feb84308834ea5ce971f7fefe2f769437da');
        assert.strictEqual(result, 5);
    });
});