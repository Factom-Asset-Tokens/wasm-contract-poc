# AssemblyScript WASM - Add Numbers

This example package demonstrates compiling a simple AssemblyScript program, `add.c` which adds two numbers to WASM, executing it in a host environment, and accessing it's methods.

## Project Structure

### Dependencies

- [NodeJS](https://nodejs.org/en/download/) & [NPM](https://www.npmjs.com/) is required to build the project dependencies, run the WASM compile, and run tests. NPM comes installed with NodeJS by default

Before running the project, you must also install the project's dependencies. From the project root, run:

```bash
npm install
```



### Directories & files

- `src/` - Contains the AssemblyScript (`.ts`) source code to be compiled into the WASM module, for example [add.ts](src/add.ts)
- `build/` - Contains the compiled output WASM file resulting from the build process
- `test/` - Contains NodeJS test code demonstrating and unit testing the functionality contained in and exposed by the compiled WASM module in `build`
- `package.json` - Contains the dependency declarations and NPM build & test scripts. Controls WASM & AssemblyScript compiler options



### Development Workflow

1. Write AssemblyScript code with exported functions
2. [Compile](#compiling-assemblyscript-to-wasm) the AssemblyScript code to WASM
3. Modify tests in `test/` to test functions exported from AssemblyScript code
4. [Run tests](#testing)
5. Repeat!



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



## Module Usage Example

How to access and use AssemblyScript WASM modules from NodeJS, from [test/add.unit.spec.js](test/add.unit.spec.js):

```js
const util = require('../../../../src/util');

const imports = util.getDefaultImports();

const buffer = fs.readFileSync(path.resolve(__dirname, '../build/add.wasm'));
module = await loader.instantiateBuffer(buffer, imports);

//use module.<function name> to access functions!
console.log(module.add(3, 99)); // => 102
```



## API

### `add(i32 x, i32 y)` - `i32`

Add two integers together and return the resulting sum



### `addRunning(i32 x)` - `i32`

Add an integer to a running total and return the resulting running total