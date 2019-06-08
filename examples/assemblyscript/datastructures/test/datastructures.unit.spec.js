const assert = require('chai').assert;
const fs = require('fs');
const path = require("path");

const util = require('../../../../src/util');

const loader = require("assemblyscript/lib/loader");

describe('AssemblyScript WASM: Datastructures', function () {

    let module;
    it('Instantiate WASM File', async function () {
        const imports = util.getDefaultImports();

        const buffer = fs.readFileSync(path.resolve(__dirname, '../build/datastructures.wasm'));
        module = await loader.instantiateBuffer(buffer, imports);
    });

    describe("Set", function () {
        it("Add", function () {
            //create a pointer to the string param "a" we will pass in as the value
            //to add to the set
            let paramPointer0 = module.__retain(module.__allocString("a"));

            //add "a" to the set by pointer
            module.setAdd(paramPointer0);

            //release the memory used to store "a"
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("b"));
            module.setAdd(paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("c"));
            module.setAdd(paramPointer0);
            module.__release(paramPointer0);

            //this add should not result in an additional element being added to the set (cardinality = 3)
            paramPointer0 = module.__retain(module.__allocString("a"));
            module.setAdd(paramPointer0);
            module.__release(paramPointer0); //always remember to release! This is the price we pay...
        });

        it("Has", function () {
            let paramPointer0 = module.__retain(module.__allocString("a"));

            const hasA = module.setHas(paramPointer0);
            module.__release(paramPointer0);
            assert.isOk(hasA); //A is truthy, but not true because WASM only understands ints & floating points
            assert.isTrue(Boolean(hasA).valueOf()); //we must cast to a bool

            //this should not exist as an element in the set
            paramPointer0 = module.__retain(module.__allocString("d"));

            const hasD = module.setHas(paramPointer0);
            module.__release(paramPointer0);

            assert.isNotOk(hasD);
            assert.isFalse(Boolean(hasD).valueOf());
        });


        it("Size", function () {
            const size = module.setSize();
            assert.strictEqual(size, 3);
        });
    });

    describe("Map", function () {
        it("Set", function () {
            //create a pointer to the string param "hello" we will pass in as the value
            let paramPointer0 = module.__retain(module.__allocString("hello"));

            //set the key 0 => "hello"
            module.mapSet(0, paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("there"));
            module.mapSet(1, paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("internet!"));
            module.mapSet(2, paramPointer0);
            module.__release(paramPointer0);

            //we're thinking bigger, let's replace 3 => "internet!" with 3 => "world!" to prove our map functionality
            paramPointer0 = module.__retain(module.__allocString("world!"));
            module.mapSet(2, paramPointer0);
            module.__release(paramPointer0);
        });

        it("Get", function () {
            const pointer = module.mapGet(2);
            const string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, 'world!');
        });

        it("Size", function () {
            const size = module.mapSize();
            assert.strictEqual(size, 3);
        });
    });
});


function debugMem(memory) {
    const mem = new Uint32Array(memory.buffer);
    mem.forEach(function (b) {
        if (b !== 0) console.log(String.fromCharCode(b));
    })
}
