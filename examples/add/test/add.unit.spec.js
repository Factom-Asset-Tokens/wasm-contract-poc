const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

describe('C WASM: Add Two Numbers', function () {

    let instance;
    it('Instantiate WASM File', async function () {
        const memory = new WebAssembly.Memory({initial: 256, maximum: 256});
        const imports = {
            env: {
                abortStackOverflow: () => {
                    throw new Error('overflow');
                },
                table: new WebAssembly.Table({initial: 0, maximum: 0, element: 'anyfunc'}),
                __table_base: 0,
                memory: memory,
                __memory_base: 1024,
                STACKTOP: 0,
                STACK_MAX: memory.buffer.byteLength,
            }
        };

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/add.wasm'));
        const result = await WebAssembly.instantiate(buffer, imports);
        instance = result.instance;

        assert.isFunction(instance.exports._add);
        assert.isFunction(instance.exports._addRunning);
    });

    it('Add Two Numbers', async function () {
        //test addition
        assert.strictEqual(instance.exports._add(5, 31), 36); //add two numbers
        assert.strictEqual(instance.exports._add(-5, 5), 0); //add signed numbers

        //check for addition mistakes
        assert.notStrictEqual(instance.exports._add(5, 31), 37);

        //Demonstrate how passing the wrong type or no type is ignored
        //This will not throw an error, instead the default C int value is used (0)
        assert.doesNotThrow(() => instance.exports._add(5, "A"));
        assert.doesNotThrow(() => instance.exports._add(5, 3.501));
        assert.doesNotThrow(() => instance.exports._add(5));
    });

    it('Running Addition', async function () {
        //test persistence of state over multiple calls
        assert.strictEqual(instance.exports._addRunning(99), 99); //add 99 to the running balance, result should be 99
        assert.strictEqual(instance.exports._addRunning(1), 100); //add 1 to the running balance, result should be 100
    });
});
