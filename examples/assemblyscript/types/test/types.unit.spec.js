const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const loader = require("assemblyscript/lib/loader");

describe('AssemblyScript WASM: Working With Types', function () {

    let module;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/types.wasm'));
        module = await loader.instantiateBuffer(buffer, imports);
    });

    describe('Booleans', function () {
        it('Get True', async function () {
            assert.isOk(module.getTrue());
            assert.strictEqual(Boolean(module.getTrue()).valueOf(), true);
        });

        it('Get False', async function () {
            assert.isNotOk(module.getFalse());
            assert.strictEqual(Boolean(module.getFalse()).valueOf(), false);
        });

        it('Echo Booolean', async function () {
            assert.isOk(module.echoBoolean(true));
            assert.strictEqual(Boolean(module.echoBoolean(true)).valueOf(), true);

            assert.isNotOk(module.echoBoolean(false));
            assert.strictEqual(Boolean(module.echoBoolean(false)).valueOf(), false);
        });

        it('Negate', async function () {
            assert.isOk(module.negate(false));
            assert.strictEqual(Boolean(module.negate(false)).valueOf(), true);
        });

        it('Or', async function () {
            assert.isOk(module.or(true, false));
            assert.isOk(module.or(false, true));
            assert.isOk(module.or(true, true));
            assert.isNotOk(module.or(false, false));
        });
    });

    describe('Integers', function () {
        it('Add', async function () {
            //test addition
            assert.strictEqual(module.add(5, 31), 36); //add two numbers
            assert.strictEqual(module.add(-5, 5), 0); //add signed numbers

            //check for addition mistakes
            assert.notStrictEqual(module.add(5, 31), 37);
        });
    });

    describe('Floats', function () {
        it('Get Float', async function () {
            const float = module.getFloat();
            assert.strictEqual(float, 1.001);
        });

        it('Add Floats', async function () {
            const x = 0.001;
            const y = 1000124124.239900001;

            let float = module.addFloats(x, y);

            //for rounding safety, the float should be truncated down to the
            // last decimal place (sigdigs)
            const xDec = countDecimals(x);
            const yDec = countDecimals(y);

            if (xDec > yDec) {
                float = Number.parseFloat(float.toFixed(xDec));
                assert.strictEqual(float, Number.parseFloat((x + y).toFixed(xDec)))
            }
            else {
                float = Number.parseFloat(float.toFixed(yDec));
                assert.strictEqual(float, Number.parseFloat((x + y).toFixed(yDec)))
            }
        });
    });

    describe('Strings', function () {
        it('Get String', function () {

            //use the __getString AssemblyScript wrapper to get the value from the pointer returned
            const pointer = module.getString();
            const string = module.__getString(pointer);

            //release the result pointer
            module.__release(pointer);

            assert.strictEqual(string, "It's Alive!!!");
        });

        //doesn't seem to be releasing memory properly? (changes ending chars on stack)
        it('Get Exciting String', function () {

            //pass a string to be made exciting into the module
            //get a place in memory for our string parameter to reside
            const paramPointer0 = module.__retain(module.__allocString("What's my purpose?"));

            const pointer = module.getExcitingString(paramPointer0);
            //use the __getString AssemblyScript wrapper to get the value from the pointer returned
            const string = module.__getString(pointer);

            //release the pointer, otherwise the param's memory alloc will persist (no fun)
            module.__release(paramPointer0);
            module.__release(pointer);

            assert.strictEqual(string, "What's my purpose?!");

            // debugMem(module.memory)
        });

        //this too?
        it('Concatenate Two Strings', function () {

            //pass a string to be made exciting into the module
            //get a place in memory for our string parameter to reside
            const pointer0 = module.__retain(module.__allocString("What's my purpose?"));
            const pointer1 = module.__retain(module.__allocString(" - To pass the butter -_-"));

            //use the __getString AssemblyScript wrapper to get the value from the pointer returned
            const pointer = module.concat(pointer0, pointer1);
            const string = module.__getString(pointer);

            //release all the pointers
            //otherwise the memory alloc will persist (no fun)
            module.__release(pointer0);
            module.__release(pointer1);
            module.__release(pointer);

            assert.strictEqual(string, "What's my purpose? - To pass the butter -_-");
        });
    });

    /*
    *
    * Arrays
    *
    * */

    describe('Arrays', function () {
        it('Get Integer Array', function () {

            //get the pointer to the resulting array
            const pointer = module.getIntArray();

            //get the array from the pointer
            const array = module.__getArray(pointer);

            //release the result pointer
            module.__release(pointer);

            assert.lengthOf(array, 5);
            assert.strictEqual(array[0], 1);
            assert.strictEqual(array[0], 1);
            assert.strictEqual(array[1], 1);
            assert.strictEqual(array[2], 3);
            assert.strictEqual(array[3], 5);
            assert.strictEqual(array[4], 8);
        });

        it('Get Array Length', function () {

            //pass in an integer array
            //allocate memory for the array being passed in
            const pointer = module.__retain(module.__allocArray(module.INT32ARRAY, [1, 2, 3, 4, 5]));

            const length = module.getLength(pointer);

            //release the memory
            module.__release(pointer);

            assert.strictEqual(length, 5);
        });
    });

});

function countDecimals(value) {
    if (Math.floor(value) === value) return 0;
    return value.toString().split(".")[1].length || 0;
}

function debugMem(memory) {
    const mem = new Uint32Array(memory.buffer);
    mem.forEach(function (b) {
        if (b !== 0) console.log(String.fromCharCode(b));
    })
}