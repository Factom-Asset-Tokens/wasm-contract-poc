![](assets/octahedron.png)![](assets/module.png)

# wasm-contract-poc

An experimental library for publishing and interacting with WASM based smart contracts on the Factom Blockchain.



## WASM Code Examples

This repository maintains a number of examples of how to build and test WASM binaries from various source languages. Each example package contains a README with documentation and instructions for use:

### C

- [Addition](examples/c/add) - Add two numbers and return the result. Also demonstrates persistence of  contract state across calls
- [Types](examples/c/types) - Demonstrates submitting and working with types in C + JS

### [AssemblyScript](https://docs.assemblyscript.org/)

- [Addition](examples/assemblyscript/add) - Add two numbers and return the result from JS. Also demonstrates persistence of contract state across calls
- [Types](examples/assemblyscript/types) - Demonstrates working with different types as params and return values calling compiled AssemblyScript WASM from JS
  - Booleans
  - Integers
  - Floating Point Numbers
  - Strings
  - Arrays
- [Data Structures](examples/assemblyscript/datastructures) - Demonstrates working with common data structures calling compiled AssemblyScript WASM from JS
  - Set<type>
  - Map (k<type> => v<type>)

