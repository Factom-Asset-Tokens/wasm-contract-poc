# C WASM - Working With Types

This example package demonstrates compiling a C program, `types.c` which working with types pased to WASM from JS



## Compiling C to WASM

[emcc](https://emscripten.org/docs/tools_reference/emcc.html) is required to compile the `add.c` code to a WASM binary:

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
describe('Integers', function () {
        it('Mult Ints', async function () {
            assert.strictEqual(wasm.instance.exports._mult(3, 99), 297); //Assert that the product of 3 and 99 is 297, checking strictly that the type return is equal to number
        });
    
    ...
    });
```



## JS API

### `_getTen()` - `int`

Return the number 10



### `_add(int x, int y)` - `int`

Add two integers, return the result



### `_mult(int x, int y)` - `int`

Multiply two integers, return the result



### `_getTenPointZeroOne()` - `double`

Return the double representation of 10.01



### IN PROGRESS:`_addFloats(number x, number y)` - `number`

Returns the float result of adding two floating point numbers together



### `_getTrue()` - `integer`

Return the integer representation of true (1)



### `_getFalse()` - `integer`

Return the integer representation of false (0)



### `_echo(boolean x)` - `integer`

Return the integer representation of boolean x



### `_negate(boolean x)` - `integer`

Return the boolean negation of integer representation of boolean x



### `_or(boolean x, boolean y)` - `integer`

Return the integer representation of boolean x or'd with boolean y



### `_getString()` - `integer`

Returns a pointer in memory to a string "It's Alive!!!"



### IN PROGRESS: `_echoString(string x)` - `integer`

Returns a pointer in memory to string x

