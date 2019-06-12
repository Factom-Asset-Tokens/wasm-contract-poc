const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;

const Contract = require('../src/Contract');
const ContractPublication = require('../src/ContractPublication');

const testContractAddress = '898b44ab3c6cb365b7d3b6af32c4b68817a2d0eca39adf53c9e7b7df3017d25b';

describe('Contract Spec', function () {
    this.timeout(10000);


    /*it('Publish A Contract', async function () {

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
    });*/

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

describe('Types Contract', function () {
    this.timeout(10000);

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
        contract = new Contract('ead7b8ea8e8dced26cd6a7be50c7d832c93443a571d1fc61f3df677109c33088');
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