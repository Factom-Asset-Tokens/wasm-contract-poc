const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const loader = require("assemblyscript/lib/loader");

describe('AssemblyScript WASM: Working With Types', function () {

    let module;
    let temp;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        //set up imported functions and constants
        imports.host = {

            //host a integer constant on the host
            count: 9001,

            //do some addition on the host
            add(x, y) {
                return x + y;
            },

            //return a string message from the host
            message() {
                //we must allocate a pointer in memory for the string result
                const pointer = module.__retain(module.__allocString("I'm An Alien"));
                return pointer;
            },
        };

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/host.wasm'));
        module = await loader.instantiateBuffer(buffer, imports);
    });

    describe('Host Constant', function () {

        it('Get Count Constant', async function () {
            const count = module.getHostCount();
            assert.strictEqual(count, 9001);
        });
    });

    describe('Host Function', function () {

        it('Host Addition', async function () {
            const count = module.getHostAdd(123, 20);
            assert.strictEqual(count, 143);
        });

        it('Host Message String', async function () {
            const pointer = module.getHostMessage();
            const string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, "I'm An Alien");
        });
    });
});