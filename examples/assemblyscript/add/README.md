# AssemblyScript WASM - Add Numbers

This example package demonstrates compiling a simple AssemblyScript program, `add.c` which adds two numbers to WASM, executing it in a host environment, and accessing it's methods.



## Installing Dependencies

from the `add` directory project root:

```bash
npm install
```



## Compiling AssemblyScript to WASM

To compile the `add.ts` code to a WASM binary:

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

### `add(i32 x, i32 y)` - `i32`

Add two integers together and return the resulting sum



### `addRunning(i32 x)` - `i32`

Add an integer to a running total and return the resulting running total