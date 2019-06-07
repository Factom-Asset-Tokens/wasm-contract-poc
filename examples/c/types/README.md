# C WASM - Add Numbers

This example package demonstrates compiling a simple C program, `add.c` which adds two numbers to WASM, executing it in a host environment, and accessing it's methods.



## Compiling C to WASM

[emcc](https://emscripten.org/docs/tools_reference/emcc.html) is required to compile the `add.c` code to a WASM binary:

```bash
npm run build
```

A `add.wasm` file will be produced in the `build` directory



## Testing

Test the module outside of the context of the blockchain:

```
npm test
```



## API

### `_add(int x, int y)` - `int`

Add two integers together and returns the result



### `_addRunning(int x)` - `int`

Add an integer to a running total and returns the resulting running total