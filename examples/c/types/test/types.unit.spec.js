const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const Walloc = require('walloc');

describe('C WASM: Use Types from JS', function () {

    let wasm;
    let walloc;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        //set up walloc - an easier way to help us allocate memory for complex params like strings
        walloc = new Walloc({
            memory: imports.env.memory,
            getTotalMemory() {
                return imports.env.memory.buffer.byteLength;
            }
        });

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/types.wasm'));
        wasm = await WebAssembly.instantiate(buffer, imports);
        wasm.imports = imports;

        assert.isFunction(wasm.instance.exports._getString);
        assert.isFunction(wasm.instance.exports._echoString);
    });

    describe('Integers', function () {
        it('Get Ten', async function () {
            assert.strictEqual(wasm.instance.exports._getTen(), 10);
        });

        it('Add Ints', async function () {
            assert.strictEqual(wasm.instance.exports._add(3, 99), 102);
        });

        it('Mult Ints', async function () {
            assert.strictEqual(wasm.instance.exports._mult(3, 99), 297);
        });
    });

    describe('Floating Point Numbers', function () {
        it('Get Float', async function () {
            assert.strictEqual(wasm.instance.exports._getTenPointZeroOne(), 10.01);
        });

        it('Add Floats', async function () {
            const value = wasm.instance.exports._addFloats(0.1, 101);
            console.log("ADD", value);
            // assert.strictEqual(, 101.1);
        });
    });

    describe('Booleans', function () {
        it('Get True', async function () {
            const truthy = wasm.instance.exports._getTrue();
            assert.strictEqual(Boolean(truthy).valueOf(), true);
        });

        it('Get False', async function () {
            const falsy = wasm.instance.exports._getFalse();
            assert.strictEqual(Boolean(falsy).valueOf(), false);
        });

        it('Echo', async function () {
            const truthy = wasm.instance.exports._echoBoolean(true);
            assert.strictEqual(Boolean(truthy).valueOf(), true);

            const falsy = wasm.instance.exports._echoBoolean(false);
            assert.strictEqual(Boolean(falsy).valueOf(), false);
        });

        it('Negate', async function () {
            const negate = wasm.instance.exports._negate(true);
            assert.strictEqual(Boolean(negate).valueOf(), false);
        });

        it('Or', async function () {
            let truthy = wasm.instance.exports._or(true, true);
            assert.strictEqual(Boolean(truthy).valueOf(), true);

            truthy = wasm.instance.exports._or(true, false);
            assert.strictEqual(Boolean(truthy).valueOf(), true);

            truthy = wasm.instance.exports._or(false, true);
            assert.strictEqual(Boolean(truthy).valueOf(), true);

            const falsy = wasm.instance.exports._or(false, false);
            assert.strictEqual(Boolean(falsy).valueOf(), false);
        });
    });

    describe('Strings', function () {
        it('Get A String - No Params', async function () {

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._getString();

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = readString(memory, pointer);

            //verify our message is expected
            assert.strictEqual(string, "It's Alive!!!");
        });

        it('Echo A String - Write in param using program owned memory & offset function', async function () {

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //get the offset (pointer) in memory to the module's parameter variable
            const paramPointer = wasm.instance.exports._getInStrOffset();

            //write the string into memory at the specified pointer
            writeString(wasm.imports.env.memory, "Unique", paramPointer);

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._echoString();

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = readString(memory, pointer);

            assert.strictEqual(string, 'anique'); //the string has been mutated
        });

        it('Echo A String - Write in param using walloc', async function () {

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //the string we'll ask our program to echo back to us
            const stringParam = "My Dear String";

            //allocate an area in memory for our param that is large enough to hold the strings bytes
            //get a pointer to that area
            const paramPointer = walloc.malloc(stringParam.length);

            //write the string's bytes to that pointer
            writeString(wasm.imports.env.memory, stringParam, paramPointer);

            //call the module, passing in the pointer to our string param in it's memory
            //get the pointer in memory returned from the call
            const pointer = wasm.instance.exports._echoStringParam(paramPointer);

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = readString(memory, pointer);

            //check the string has been returned un-mutated
            assert.strictEqual(string, stringParam);
        });

    });
});

//write a string into memory given a pointer
function writeString(mem, str, ptr) {
    const strBuf = Buffer.from(str);
    const outBuf = new Uint8Array(mem.buffer, ptr, strBuf.length);
    for (let i = 0; i < strBuf.length; i++) {
        outBuf[i] = strBuf[i];
    }
}

//read a string from memory given a pointer
function readString(mem, ptr) {
    let s = "";
    for (let i = ptr; mem[i]; i++) {
        s += String.fromCharCode(mem[i]);
    }
    return s;
}