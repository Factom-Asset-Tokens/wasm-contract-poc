const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');
const loader = require("assemblyscript/lib/loader");

describe('AssemblyScript WASM: Add Two Numbers', function () {

    it('Instantiate WASM File - Native WebAssembly', async function () {
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
                abort: function (a) {
                    if (a) console.error('ABORT:', a);
                    else console.log('ABORT');
                }
            }
        };

        const buffer = fs.readFileSync(path.resolve(__dirname, '../../../assemblyscript/add/build/add.wasm'));
        const wasmModule = new WebAssembly.Module(buffer);
        const wasmInstance = new WebAssembly.Instance(wasmModule, imports);

        assert.strictEqual(wasmInstance.exports.add(1, 20), 21);

        //You can also use the built in memory allocation & deallocation functions
        //that are injected into AssemblyScript binaries if using a module built by AS

        //allocate a 32 Byte space in the module's memory and get the pointer
        const pointer0 = wasmInstance.exports.__retain(wasmInstance.exports.__alloc(32));

        //and again
        const pointer1 = wasmInstance.exports.__retain(wasmInstance.exports.__alloc(32));

        //check that our memory was allocated in different segments
        assert.isAbove(pointer1, pointer0);

        //deallocate our memory
        wasmInstance.exports.__release(pointer0);
        wasmInstance.exports.__release(pointer1);

        //allocate another space
        const pointer2 = wasmInstance.exports.__retain(wasmInstance.exports.__alloc(32));

        //check that our old memory from pointer 0 and 1 were released
        //if the new pointer is equal to the very virst the we're good!
        assert.strictEqual(pointer2, pointer0);
    });

    let module;
    it('Instantiate WASM File - AssemblyScript Loader', async function () {
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
