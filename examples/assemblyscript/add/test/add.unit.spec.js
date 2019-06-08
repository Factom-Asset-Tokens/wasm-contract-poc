const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');
const loader = require("assemblyscript/lib/loader");

describe('AssemblyScript WASM: Add Two Numbers', function () {

    let module;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/add.wasm'));
        module = await loader.instantiateBuffer(buffer, imports);

        assert.isFunction(module.add);
    });

    it('Add Two Numbers', async function () {
        //test addition
        assert.strictEqual(module.add(5, 31), 36); //add two numbers
        assert.strictEqual(module.add(-5, 5), 0); //add signed numbers

        //check for addition mistakes
        assert.notStrictEqual(module.add(5, 31), 37);

        //Demonstrate how passing the wrong type or no type is ignored
        //This will not throw an error, instead the default C int value is used (0)
        assert.doesNotThrow(() => module.add(5, "A"));
        assert.doesNotThrow(() => module.add(5, 3.501));
        assert.doesNotThrow(() => module.add(5));
    });

    it('Running Addition', async function () {
        //test persistence of state over multiple calls
        assert.strictEqual(module.addRunning(99), 99); //add 99 to the running balance, result should be 99
        assert.strictEqual(module.addRunning(1), 100); //add 1 to the running balance, result should be 100
    });
});
