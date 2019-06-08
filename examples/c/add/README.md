# C WASM - Add Numbers

This example package demonstrates compiling a simple C program, `add.c` which adds two numbers to WASM, executing it in a host environment, and accessing it's methods.



## Project Structure

### Dependencies

- [NodeJS](https://nodejs.org/en/download/) & [NPM](https://www.npmjs.com/) is required to build the project dependencies, run the WASM compile, and run tests. NPM comes installed with NodeJS by default
- The [EMCC](https://emscripten.org/docs/getting_started/downloads.html) compiler toolchain is required to compile C code to WASM

Before running the project, you must also install the project's dependencies:

```bash
npm install
```



### Directories & files

- `src/` - Contains the C source code to be compiled into the WASM module, for example [add.c](src/add.c)
- `build/` - Contains the compiled output WASM file resulting from the build process
- `test/` - Contains NodeJS test code demonstrating and unit testing the functionality contained in and exposed by the compiled WASM module in `build`
- `package.json` - Contains the dependency declarations and NPM build & test scripts. Controls WASM compiler options



### Development Workflow

1. Write C Code with exported functions
2. (if needed) Modify `package.json`'s build script to include any new exported C functions (`-s EXPORTED_FUNCTIONS=\"[...]\"`)
3. [Compile](#compiling-c-to-wasm) the C code to WASM
4. Modify tests in `test/` to test functionality exported from C
5. [Run tests](#testing)
6. Repeat!



## Compiling C to WASM

```bash
npm run build
```

An `add.wasm` file will be produced in the `build` directory



## Testing

Test the module outside of the context of the blockchain:

```bash
npm test
```



## Module Usage Example

How to access and use WASM modules from NodeJS, from [test/add.unit.spec.js](test/add.unit.spec.js):

```js
const util = require('../../../../src/util');

const buffer = fs.readFileSync(path.resolve(__dirname, '../build/add.wasm'));
const imports = util.getDefaultImports();

const result = await WebAssembly.instantiate(buffer, imports);

//use result.instance.exports to access functions prefixed by "_"
console.log(result.instance.exports._add(3, 99)); // => 102
```



## API

### `_add(int x, int y)` - `int`

Add two integers together and returns the result



### `_addRunning(int x)` - `int`

Add an integer to a running total and returns the resulting running total