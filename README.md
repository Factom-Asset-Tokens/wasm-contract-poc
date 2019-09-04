![](assets/octahedron.png)![](assets/module.png)

# wasm-contract-poc

> **Please note**: this project is in constant flux (or is dead) and is primarily for experimentation and proof of concept purposes. This project is part of the Factom Asset Token Smart Contract grant series funded by the Factom Protocol. It is designed to test out WASM as a candidate technology for a larger integration with the Factom Asset Token ecosystem.
>
> [Factom Asset Tokens Smart Contract Research Grant](https://factomize.com/forums/threads/dbgrow-factom-001-fat-smart-contracts.1960/)
>
> [Factom Asset Tokens Smart Contract Research Paper](https://docs.google.com/document/d/12HeGY7WePF9vaAg4CfQlmeseCOBeBgEvrOrE71Tu_w8/edit#)
>
> [Factom Asset Tokens Smart Contract Development Grant](https://factomize.com/forums/threads/matt-york-paul-bernier-dbgrow-canonical-ledgers-1-fat-smart-contracts-2-development.2291/)



An experimental library for publishing and interacting with WASM based smart contracts on the Factom Blockchain.

This library demonstrates:

- Publishing WASM based contracts to a Factom network via the first entry in a chain
  - Storing a binary WASM contract in extids (limit 10KB)
- Calling functions in a contract
  - Simulating calls (no write)
  - Writing function calls as entries to the contract chain
- Calculating state for a contract based on call entries
- Retrieving the deterministic return value & state of a function call by entryhash



## Choosing A Contract

Before you publish a contract, you'll need to choose or write a WASM contract binary to deploy. WASM contracts can be programmed in a myriad of source languages such as C, C++, TypeScript, Go, and more.

 You can deploy any of the the WASM binaries from any of our [Wasm Code Examples](#wasm-code-examples) which demonstrate writing WASM in various source languages such as C and AssemblyScript(TypeScript).



## Publishing A Contract

Publishing a contract requires two things, a WASM contract binary and an [Application Binary Interface](#application-binary-interface) (ABI) definition.

Once you have your WASM binary file you can use the [ContractPublication](src/ContractPublication.js) class and builder to construct the contract publication, and the [Contract](src/Contract.js) class to publish and interact with your contract.

```javascript
const {Contract, ContractPublication} = require('wasm-contract-poc/src/ContractPublication');

//Get the contract buffer from the WASM file
const contract = fs.readFileSync('/path/to/contract.wasm'));

//Use the ContractPublication builder to construct the publication
//Define the ABI for exported functions form the WASM contract
const publication = ContractPublication.builder(contract)
            .func('_myFunc', ['boolean'], 'boolean')
            .build();
//get the chainId of the published contract
const result = await Contract.publish(publication);

console.log(result); // => "898b44ab3c6cb365b7d3b6af32c4b68817a2d0eca39adf53c9e7b7df3017d25b"
```



### Application Binary Interface

The ABI is a datastructure that defines how the higher level smart contract platform interfaces with the low level binary WASM code. At it's heart a WASM VM is a very low level machine which needs help understanding how to interpret more complex types like strings from the host environment, and vice versa.

ABI's in this system are simple, defining only the function name, argument types and return type. For example, defining a function exposed by our WASM called "_add" that takes in two number arguments and returns a boolean using ContractPublication.builder():

```javascript
const publication = ContractPublication.builder(contract)
            .func('_add', ['number'], 'number') // function name, argument types, return type,
            .build();
```

Some more examples:

```json
//a function with multiple arguments with different types
const publication = ContractPublication.builder(contract)
            .func('_multi', ['string', 'number', 'boolean'], 'boolean')
            .build();
```



#### ABI Parameter & Return Types

Types are tightly linked to JSON:

- `boolean` - true or false
- `number` - An integer or floating point number
- `string` - A character array



## Loading A Contract

Once you have the Factom chain ID of the contract you want to use, you can load the contract using the [Contract](src/Contract.js) class:

```javascript
const contract = new Contract(chainId);
```



## Calling A Contract

To call the contract you can use the `call(func, args, write)` function. This function simulates a call to a contract's function with arguments at the latest calculated state and returns the return value of the function called if the call executes successfully.

Functions with no return value (void) return the [Void]() object

`call(func, args, write)`

- `func` - The function name to call in the contract
- `args` - The array of arguments to call `func` with
- `write` - Optional. A boolean specifying whether to write an entry to Factom if the call is successful, and changes the internal state of the contract. Default true

```javascript
let call = await contract.call('_or', [true, false]);
console.log(call.result); // => true

call = await contract.call('_or', [false, false]);
console.log(call.result); // => false

//execute a call with a string parameter
call = await contract.call('_echoString', ['Say Hello!']);
console.log(call.result); // => Say Hello!

//store a value in the contract's memory, the result is Void
call = await contract.call('_storeString', ['Store me please?']);
console.log(call.result); // => Void {}
console.log(call); // => {{result: Void {}, entryhash: 'ead7b8ea8e8dced26cd6a7be50c7d832c93443a571d1fc61f3df677109c33088'}
```

A call that alter's the contract's memory will be submitted to Factom if `write` is not set to false, as it changes the state of the contract. You can simulate a call that alters the contract's memory without submission by passing false as the third parameter in `call(func, args, write)`. Calls that cause a write to Factom return the newly committed entry's entryhash under `call.entryhash` in the above example.



## Getting the Deterministic Result of a Call

After a writing call occurs and the call entry is confirmed on the Factom network, you can get the absolute final result using `getResult(entryhash)` and the call's entryhash:

- `entryhash` - The Factom entryhash of the call to retrieve the return value of

For example, the result of adding 10 to a running total of 3 living in contract memory:

```javascript
const result = await contract.getResult('a0dbead86874532ef4fc150ae4dd2590b7ed85541e50369225305bf3e7846d18');
console.log(result); // => 13
```

Retrieving the result of an invalid or errored call entry will throw an error.



## Experimental - Gas Usage & Limit :unicorn:

Check out the [Contract](src/Contract.js) class to view a demonstration of how gas usage & limit are implemented.

Compiled WASM code is broken down into Opcodes just as EVM bytecode is, allowing a potential for a virtual cost basis for VM operations. For example, see a a [default gas cost table](https://github.com/ewasm/wasm-metering/blob/master/defaultCostTable.json) for WASM VM operations as part of the [wasm-metering](https://github.com/ewasm/wasm-metering) library we implement currently.

Each function call currently has a gas limit of 99,999,999. To put this in perspective, with the default cost table adding two integers together in C WASM uses approximately 400 gas. Echoing a string parameter uses approximately 2000 gas.

### Gas Isn't an Asset

It's important to note that in this library gas is not "charged" whatsoever. Using gas is not tied to payment in any token or asset, unlike Ethereum. Gas usage & gas limit are merely concepts implemented in this library's WASM VM to track and limit the execution expense of a called function. 

For example, imagine a recursive factorial function given an immense number that could be stopped preemptively before exhausting all the VM's memory. Limiting resource usage per call helps protect host environments from being abused by DOS-like attacks.

### Function Specific Gas Limit :unicorn: :unicorn:

In the near future we may allow functions defined in the ABI to define function specific gas limits lower than the absolute gas limit. The current absulte limit has no realistic basis and will change.



## State of Development & Gotchas

- Global gas limit is currently not tuned or based on reality. It has an arbitrary value of 99,999,999 gas which is massive compared to a typical call's requirements for dev purposes for not.
- ABI's & Calls don't support array argument or return types yet
- Floating point math is hard. JS only supports 32 bit ints & floats, while WASM supports 32 & 64 bit ints and floats. Adding 0.011 + 1.0 in C from JS results in some very strange results like 1.01100000004984. :cry: We're looking into a solution.



## WASM Code Examples

This repository maintains a number of examples of how to build and test WASM binaries from various source languages. Each example package contains a README with documentation and instructions for use:

### C

- [Addition](examples/c/add) - Add two numbers and return the result. Also demonstrates persistence of  contract state across calls
- [Types](examples/c/types) - Demonstrates working with different types as params and return values calling compiled C WASM from JS
  - Booleans
  - Integers
  - Floating Point Numbers
  - Strings
- [Host Interaction](examples/c/host) - Demonstrates C code calling functions exported by the host environment, getting the result from the perspective of C code in JS. Also demonstrates the host returning dynamic values from imported functions.

### [AssemblyScript](https://docs.assemblyscript.org/)

- [Addition](examples/assemblyscript/add) - Add two numbers and return the result, calling compiled AssemblyScript WASM. Also demonstrates persistence of contract state across calls
- [Types](examples/assemblyscript/types) - Demonstrates working with different types as params and return values calling compiled AssemblyScript WASM from JS
  - Booleans
  - Integers
  - Floating Point Numbers
  - Strings
  - Arrays
- [Data Structures](examples/assemblyscript/datastructures) - Demonstrates working with common high level data structures in AS and calling compiled AssemblyScript WASM from JS
  - Array\<type\>
  - Set\<type\>
  - Map (k\<type\> => v\<type\>)
- [Host Interaction](examples/assemblyscript/host) - Demonstrates AssemblyScript code interacting with functions and constants exported by the host environment, getting the result in JS. Also demonstrates the host returning dynamic values from imported functions.

