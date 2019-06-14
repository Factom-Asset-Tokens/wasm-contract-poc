const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const Walloc = require('walloc');

describe('C WASM: Use Types from JS', function () {

    let wasm;
    let walloc;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports(500);

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

            // debugMem(wasm.imports.env.memory);
        });
    });

    describe('Strings', function () {
        it('Get A String - No Params', async function () {

            //get a handle on the WASM module's memory

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._getString();

            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = readString(memory, pointer);

            //verify our message is expected
            assert.strictEqual(string, "It's Alive!!!");

            // debugMem(wasm.imports.env.memory);
        });

        it('Echo A String - Write in param using program owned memory & offset function', async function () {


            //get the offset (pointer) in memory to the module's parameter variable
            const paramPointer = wasm.instance.exports._getInStrOffset();

            console.log('PARAM POINTER', paramPointer);

            //write the string into memory at the specified pointer
            writeString(wasm.imports.env.memory, "Unique", paramPointer);

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._echoString();

            console.log('RES POINTER', pointer);

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = readString(memory, pointer);

            //free the memory from writing in the param
            // walloc.free(paramPointer);

            assert.strictEqual(string, 'anique'); //the string has been mutated

            // debugMem(wasm.imports.env.memory);
        });

        it('Echo A String - Write in param using walloc', async function () {

            //the string we'll ask our program to echo back to us
            const stringParam = "My Dear String";

            //allocate an area in memory for our param that is large enough to hold the strings bytes
            //get a pointer to that area
            const paramPointer = walloc.malloc(stringParam.length);
            let a = walloc.malloc(100);
            console.log(a);

            console.log('PARAM POINTER', paramPointer);

            //write the string's bytes to that pointer
            writeString(wasm.imports.env.memory, stringParam, paramPointer);

            //call the module, passing in the pointer to our string param in it's memory
            //getting the pointer in memory returned from the call
            const pointer = wasm.instance.exports._echoStringParam(paramPointer);

            console.log('RES POINTER', paramPointer);

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //read off the memory at the result pointer
            const string = readString(memory, pointer);

            //free the memory from writing in the param
            walloc.free(paramPointer);

            //in this case we don't call free on our result, as it's the same
            //pointer we passed in

            //check the string has been returned un-mutated
            assert.strictEqual(string, stringParam);

            // debugMem(wasm.imports.env.memory);
        });
    });

    describe('Arrays', async function () {

        it('Echo An Integer Array', async function () {

            //Regenerate the WASM. This gets around a mysterious memory allocation bug not currently solved :(
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


            //the integer array we'll ask our program to echo back to us
            const integerArray = [1, 2, 3, 4, 5, 6, 7];

            //allocate an area in memory for our param that is large enough to hold the strings bytes
            //get a pointer to that area
            const paramPointer = walloc.malloc(integerArray.length);

            //write the string's bytes to that pointer
            writeNumberArray(wasm.imports.env.memory, integerArray, paramPointer);

            //call the module, passing in the pointer to our string param in it's memory
            //getting the pointer in memory returned from the call
            const pointer = wasm.instance.exports._echoIntegerArray(paramPointer);

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //read off the memory at the result pointer
            const result = readNumberArray(memory, pointer);

            //free the memory from writing in the param
            walloc.free(paramPointer);

            assert.strictEqual(JSON.stringify(result), JSON.stringify(integerArray));
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

//write an number array into memory given a pointer
function writeNumberArray(mem, arr, ptr) {
    const outBuf = new Uint8Array(mem.buffer, ptr, arr.length);
    for (let i = 0; i < outBuf.length; i++) {
        outBuf[i] = arr[i];
    }
}

//read an number array from memory given a pointer
function readNumberArray(mem, ptr) {
    let a = [];
    for (let i = ptr; mem[i]; i++) {
        a.push(mem[i]);
    }
    return a;
}

function debugMem(memory) {
    const mem = new Uint32Array(memory.buffer);
    for (let i = 0; i < mem.length; i++) {
        if (mem[i] !== 0) console.log(i, String.fromCharCode(mem[i]));
    }
}