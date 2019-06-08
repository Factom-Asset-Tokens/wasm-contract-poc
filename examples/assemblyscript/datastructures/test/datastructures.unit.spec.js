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

    describe("Array", function () {
        it("Push", function () {
            let paramPointer0 = module.__retain(module.__allocString("hey"));
            module.arrayPush(paramPointer0);

            //release the memory used to store "hey"
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("we"));
            module.arrayPush(paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("did"));
            module.arrayPush(paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("a"));
            module.arrayPush(paramPointer0);
            module.__release(paramPointer0);

            paramPointer0 = module.__retain(module.__allocString("contract!"));
            module.arrayPush(paramPointer0);
            module.__release(paramPointer0);
        });

        it("Get", function () {
            let pointer = module.arrayGet(0);
            let string = module.__getString(pointer);
            module.__release(pointer);
            assert.strictEqual(string, "hey");

            pointer = module.arrayGet(2);
            string = module.__getString(pointer);
            module.__release(pointer); //sigh always

            assert.strictEqual(string, "did");
        });

        it("Pop", function () {
            //Pull a value off the end of the array (length-1)
            let pointer = module.arrayPop();
            let string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, "contract!");

            //pull another value
            pointer = module.arrayPop();
            string = module.__getString(pointer);
            module.__release(pointer);
            assert.strictEqual(string, "a");
        });

        it("Shift", function () {
            //Pull a value off the beginning of the array (0)
            let pointer = module.arrayShift();
            let string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, "hey");
        });

        it("Length", function () {
            //after pop length should be 3 down from 5
            let length = module.arrayLength();
            assert.strictEqual(length, 2);

            //pop a value off of the array to test the length works
            let pointer = module.arrayPop();
            let string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, 'did');

            length = module.arrayLength();
            assert.strictEqual(length, 1);
        });
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
            let pointer = module.mapGet(2);
            let string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, 'world!');

            //trying to get a nonexistant key throws a RuntimeError
            assert.throws(() => module.mapGet(5));
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
