# C WASM - Interacting With The Host

This example package demonstrates compiling a C program, `host.c` which demonstrates calling imported functions residing on the host from C code.

This example also demonstrates returning dynamic values via reference from the host. For example, from a JS host:

1. The host defines a reference to an integer: `let hostInteger = 123;`
2. The host defines an imported function for the WASM environment: `getInteger(){return hostInteger;}` , which returns the integer reference
3. The host calls a function in the WASM contract that echoes the result of `getInteger()` called from C code. The result is 123
4. The host changes the host integer: `hostInteger = 999;`
5. Repeating step 3 results in 999



## Compiling C to WASM

[emcc](https://emscripten.org/docs/tools_reference/emcc.html) is required to compile the `host.c` code to a WASM binary:

```bash
npm run build
```

A `host.wasm` file will be produced in the `build` directory



## Testing

Test the module outside of the context of the blockchain:

```
npm test
```

This will run NodeJS based tests in the `test` directory. For example in `host.unit.spec.js` test instantiation of the compiled WASM module, and assertions to verify its API and behavior:

```javascript
describe('Integers', function () {
        it('Echo Host Integer', async function () {
            const integer = wasm.instance.exports._echoHostInt();
            assert.strictEqual(integer, 99);
        });
    ...
});
```



## JS API

### `_echoHostInt()` - `i32`

Return an integer value from the host function `_getInteger()`



### `_echoHostString()` - `string(i32)`

Return a the pointer to a string value from the host function `_getString()`