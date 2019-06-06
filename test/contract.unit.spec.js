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
});