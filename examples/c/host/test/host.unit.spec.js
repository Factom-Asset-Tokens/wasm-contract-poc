const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const Walloc = require('walloc');

describe('C WASM: Host Interaction', function () {

    let wasm;
    let walloc;

    let hostInteger = 99;
    let hostString = "I'm a Host!";

    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        //set up imported functions on the host
        //these can be called from your wasm source code!

        //function to get a dynamic integer from the host
        imports.env._getInteger = function () {
            return hostInteger;
        };

        //get a string pointer from the host
        imports.env._getString = function () {

            //allocate space for the returned param
            const paramPointer = walloc.malloc(hostString.length);

            //write string to pointer
            writeString(imports.env.memory, hostString, paramPointer);
            return paramPointer;
        };

        //set up walloc - an easier way to help us allocate memory for complex params like strings
        walloc = new Walloc({
            memory: imports.env.memory,
            getTotalMemory() {
                return imports.env.memory.buffer.byteLength;
            }
        });

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/host.wasm'));
        wasm = await WebAssembly.instantiate(buffer, imports);
        wasm.imports = imports;

        assert.isFunction(wasm.instance.exports._echoHostInt);
        assert.isFunction(wasm.instance.exports._echoHostString);
    });

    describe('Integers', function () {
        it('Echo Host Integer', async function () {
            const integer = wasm.instance.exports._echoHostInt();
            assert.strictEqual(integer, 99);
        });

        it('Echo Host Integer - Host dynamically modifies return reference', async function () {
            //Alter the return value of our getInteger() function we imported into the WASM environment
            hostInteger = 1337;

            const integer = wasm.instance.exports._echoHostInt();
            assert.strictEqual(integer, 1337);
        });
    });

    describe("Strings", function () {
        it('Get Host String', async function () {

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //call the module, passing in the pointer to our string param in it's memory
            //getting the pointer in memory returned from the call
            const pointer = wasm.instance.exports._echoHostString();

            //read off the memory at the result pointer
            const string = readString(memory, pointer);

            //free the memory from the result
            walloc.free(pointer);

            //check the host string has been returned un-mutated
            assert.strictEqual(string, "I'm a Host!");
        });

        it('Get Host String - Host dynamically modifies return reference', async function () {

            //alter the return of our getString() function on the host:
            hostString = "I'm a dynamic host now...";

            //get a handle on the WASM module's memory
            const memory = new Uint8Array(wasm.imports.env.memory.buffer);

            //call the module, passing in the pointer to our string param in it's memory
            //getting the pointer in memory returned from the call
            const pointer = wasm.instance.exports._echoHostString();

            //read off the memory at the result pointer
            const string = readString(memory, pointer);

            //free the memory from the result
            walloc.free(pointer);

            //check the host string has been returned un-mutated
            assert.strictEqual(string, "I'm a dynamic host now...");
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