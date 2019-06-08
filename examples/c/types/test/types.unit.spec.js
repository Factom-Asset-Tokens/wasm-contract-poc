const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

describe('C WASM: Use Types from JS', function () {

    let wasm;
    let memory;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

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
            // assert.strictEqual(wasm.instance.exports._addFloats(0.1,101), 101.1);
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
            memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._getString();

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = getUTF8String(memory, pointer);

            //verify our message is expected
            assert.strictEqual(string, "It's Alive!!!");
        });

        it('Echo A String', async function () {

            //get a handle on the WASM module's memory
            memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //get the pointer in memory resulting from the call (int)
            const pointer = wasm.instance.exports._echoString("ppp");

            //read off the memory belonging to that pointer encoded to UTF-8
            const string = getUTF8String(memory, pointer);

            console.log('PTR:', pointer, 'Got', string);

            assert.isString(string);
        });
    });
});

function getUTF8String(mem, ptr) {
    let s = "";
    for (let i = ptr; mem[i]; i++) {
        s += String.fromCharCode(mem[i]);
    }
    return s;
}