# AssemblyScript WASM - Datastructures

This example package demonstrates compiling a AssemblyScript program, `datastructures.ts` which demonstrates working with the AssemblyScript `Map` and `Set` data structures.



## Installing Dependencies

from the `add` directory project root:

```bash
npm install
```



## Compiling AssemblyScript to WASM

To compile the `datastructures.ts` code to a WASM binary:

```bash
npm run build
```

A `datastructures.wasm` file will be produced in the `build` directory



## Testing

Test the module outside of the context of the blockchain:

```
npm test
```

This will run NodeJS based tests in the `test` directory. For example in `datastructures.unit.spec.js` test instantiation of the compiled WASM module, and assertions to verify its API and behavior:

```javascript
describe('Map', function () {
        it('Set', function () {
            //create a pointer to the string param "hello" we will pass in as the value
            let paramPointer0 = module.__retain(module.__allocString("hello"));

            //set the key 0 => "hello"
            module.mapSet(0, paramPointer0);
            module.__release(paramPointer0); //release the memory for the pointer
            
            //get the value from memory
            const pointer = module.mapGet(0);
            const string = module.__getString(pointer);
            module.__release(pointer);

            assert.strictEqual(string, 'hello'); // => true!
        });
    
    ...
    });
```



## API

### `arrayPush(string(i32) x)` - `void`

Add the string at pointer x to the end of the internal Array<string>



### `arrayPop()` - `string(i32)`

Remove the last element from the internal array and return the pointer to the string element



### `arrayShift()` - `string(i32)`

Remove the first element from the internal array and return the pointer to the string element



### `arrayGet(string(i8) x)` - `void`

Get the pointer to the string at index x in the internal Array<string>



### `arrayLength()` - `i32`

Return the length of the internal Array<string>



### `setAdd(string(i32) x)` - `void`

Add the string at pointer x to the internal Set<string>



### `setHas(string(i32) x)` - `i32`

Check if the string at pointer x is contained in the internal Set<string>. Return the integer representation of the boolean result (0/1)



### `setSize()` - `i32`

Return the number of elements in the internal Set<string> (cardinality)



### `mapSet(i32 k, string(i32) v)` - `i32`

Set the integer key k in the internal Map<i32, string> to string value at pointer v



### `mapGet(i32 k)` - `string(i32)`

Return the pointer to the string value in memory mapped to int k



### `mapSize()` - `i32`

Return the number of keys in the internal Map<i32, string>

