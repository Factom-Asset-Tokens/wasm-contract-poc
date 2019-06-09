# AssemblyScript WASM - Host Interface & Interaction

This example package demonstrates compiling a simple AssemblyScript program, `host.ts` which access various constants and functions made available by the host environment.



## Installing Dependencies

from the project root:

```bash
npm install
```



## Compiling AssemblyScript to WASM

To compile the `host.ts` code to a WASM binary:

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
describe('Host Constant', function () {
        it('Get Count Constant', async function () {
            const count = module.getHostCount();
            assert.strictEqual(count, 9001);
        });
    ...
    });
```



## API

### `getHostCount()` - `i32`

Return the count constant exposed by the host



### `getHostAdd(i32 x, i32 y)` - `i32`

Return the result of adding x and y on the host



### `getHostMessage()` - `string(i32)`

Returns a pointer to the message string exposed by the host

