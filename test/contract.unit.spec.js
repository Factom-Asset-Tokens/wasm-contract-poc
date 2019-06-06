const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;
describe('Contract', function () {

    const Contract = require('../src/Contract');

    it('Publish A Contract', async function () {

        //get the simple addition example contract
        const contract = fs.readFileSync(path.resolve(__dirname, '../examples/c/add/build/add.wasm'));

        //publish to Factom
        const result = await Contract.publish(contract);

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
        assert.instanceOf(wasm.instance, WebAssembly.Instance);
        assert.instanceOf(wasm.module, WebAssembly.Module);
    });

});