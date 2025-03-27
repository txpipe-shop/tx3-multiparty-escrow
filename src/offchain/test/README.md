# Tests
To test the offchain operations, you can run the following commands inside the `test` folder.
The tests will always consider the creation of a channel with an initial deposit of 6 tokens.

**Create an order**
```shell
   $> deno run --allow-env --allow-read offchain/test/openChannel.ts
```
**Update an order**
```shell
   $> deno run --allow-env --allow-read offchain/test/openAndUpdateChannel.ts
```