const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

describe('C WASM: Add Two Numbers', function () {

    let wasm;
    let memory;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/types.wasm'));
        wasm = await WebAssembly.instantiate(buffer, imports);
        wasm.imports = imports;

        assert.isFunction(wasm.instance.exports._getString);
    });

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
});

function getUTF8String(mem, ptr) {
    let s = "";
    for (let i = ptr; mem[i]; i++) {
        s += String.fromCharCode(mem[i]);
    }
    return s;
}