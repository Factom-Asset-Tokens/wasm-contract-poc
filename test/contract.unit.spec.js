const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const Contract = require('../src/Contract');
const ContractPublication = require('../src/ContractPublication');

const testContractAddress = '7486a1669fa743d89a60845e396fec30f514c20c1b8ad37f90e3e460040b52f4';

describe('Contract Spec', function () {
    this.timeout(60000);

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
        console.log('Wrote writing call', call);
    });

    it('Get Result Of Call', async function () {
        const result = await contract.getResult('40b201a2c76a536813e792de6bb4d62853d88b03dfa2912d8bac6fbb0631e880');
        console.log('RES:', result);
        assert.strictEqual(result, 18);
    });
});

describe('Types Contract', function () {
    this.timeout(60000);

    it('Publish Types Contract', async function () {

        //get the simple addition example contract
        const contract = fs.readFileSync(path.resolve(__dirname, '../examples/c/types/build/types.wasm'));

        const publication = ContractPublication.builder(contract)
            .func('_negate', ['boolean'], 'boolean')
            .func('_or', ['boolean', 'boolean'], 'boolean')
            .func('_echoStringParam', ['string'], 'string')
            .build();

        //publish to Factom
        const result = await Contract.publish(publication);

        console.log('Published Types Contract!', result);

        assert.isString(result);
    });

    let contract;
    it('Load Types Contract', async function () {
        contract = new Contract('e8da59ec83df29867e55bbfc48a5b74025cb3d443e2c785c5f2f448553de3a6f');
        await contract.init();

        console.log('Loaded types.wasm contract!');
    });

    it('Call Contract Function - Negate Boolean', async function () {
        const result = await contract.call('_negate', [false]);

        assert.strictEqual(result.result, true);
    });

    it('Call Contract Function - Or Boolean', async function () {
        let result = await contract.call('_or', [true, false]);
        assert.isTrue(result.result);

        result = await contract.call('_or', [false, true]);
        assert.isTrue(result.result);

        result = await contract.call('_or', [false, false]);
        assert.isFalse(result.result);
    });

    it('Call Contract Function - Echo String Param', async function () {
        const result = await contract.call('_echoStringParam', ["I'm Alive!"]);
        assert.strictEqual(result.result, "I'm Alive!");
    });
});