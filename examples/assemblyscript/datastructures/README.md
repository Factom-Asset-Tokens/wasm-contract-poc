# AssemblyScript WASM - Add Numbers

This example package demonstrates compiling a simple AssemblyScript program, `datastructures.ts` which adds two numbers to WASM, executing it in a host environment, and accessing it's methods.



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

A `types.wasm` file will be produced in the `build` directory



## Testing

Test the module outside of the context of the blockchain:

```
npm test
```

This will run NodeJS based tests in the `test` directory. For example in `types.unit.spec.js` test instantiation of the compiled WASM module, and assertions to verify its API and behavior:

```javascript
describe('Strings', function () {
        it('Get String', function () {

            //use the __getString AssemblyScript wrapper to get the value from the pointer returned
            const pointer = module.getString();
            const string = module.__getString(pointer);

            //release the result pointer
            module.__release(pointer);

            assert.strictEqual(string, "It's Alive!!!");
        });
    
    ...
    });
```



## API

### `add(i32 x, i32 y)` - `i32`

Add two integers, return the result



### `getFloat()` - `f64`

Return the double representation of 1.001



### `addFloats(f64 x, f64 y)` - `f64`

Returns the float result of adding two floating point numbers together



### `getTrue()` - `i32`

Return the integer representation of true (1)



### `getFalse()` - `i32`

Return the integer representation of false (0)



### `echoBoolean(i32 x)` - `i32`

Return the integer representation of i32 x



### `negate(boolean x)` - `i32`

Return the boolean negation of integer representation of boolean x



### `or(boolean x, boolean y)` - `i32`

Return the integer representation of boolean x or'd with boolean y



### `getString()` - `i32`

Returns a pointer in memory to a string "It's Alive!!!"



### `getExcitingString(string(i32) x)` - `string(i32)`

Appends an exclamation point on the end of string pointer x



### `concat(string(i32) x, string(i32) y)` - `string(i32)`

Appends string pointer x to string pointer y and returns a pointer to the result



### `getIntArray()` - `array(i32)`

Returns a pointer in memory the integer array [1, 1, 3, 5, 8]



### `getLength(array(i32) x)` - `i32`

Returns the length of the array at pointer x

