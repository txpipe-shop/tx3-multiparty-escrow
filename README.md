# MultiParty Escrow
The MultiParty Escrow (MPE) smart contract manages payment channels between **clients** —who act as senders, consumers, or service customers— and **service providers**, who serve as receivers or recipients.

## Documentation
- [Requirements](./docs/requeriments.md)
- [Design](./docs/design.md)

## Environment files

We need to have a `.env` file at the src with the following content:

```js
PORT = 3000
PROVIDER_PROJECT_ID = ""
PROVIDER_URL = ""
NETWORK = ""
CONFIG_FILE = ""
```

Where CONFIG_FILE is the name of a file inside the project, with the following format:

```js
{
   // "token": "[policyId][hexaName]"
   "token": "921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce132041474958",
   "ref_script": {
      "txHash": "d307d64e839f499a53f8a70bb98b21aacecb54ae441998947aabb6c13b36c0dd"
   }
}
```

Some scripts that run on test networks rely on a 24-word mnemonic which must be set on a `.test-env` file at src:
```js
SEED=soda water ...
```
Note: For safety, always use a mnemonic intended only for testing. Never use real or production mnemonics.

## Run Instructions


### Server
For the first time, run `npm install` inside the `src` folder to install all the dependencies.

To run the server, run `npm run dev` inside the `src` folder.

### Compile validator
**Note**: Aiken must be installed. Check the `aiken.toml` file to match the correct compiler version.

Inside `onchain`, run `aiken build`.

### Generate types
Run `bash parse-blueprint.sh` to generate the contract types from the validator's blueprint.

### Test with emulator
To test the offchain operations, you can run the following commands from the `src` folder.

**Open a channel**
A channel with 6 tokens will be created.
```shell
   $> npm run test-open
```
**Update a channel**
A channel will be created and then updated, funding 3 tokens more and extending its expiration date.
```shell
   $> npm run test-update
```

**Build a message**
A channel will be created with an initial amount of 6 tokens, and a message will be created and signed, indicating that the receiver can claim 3 tokens from the channel.
```shell
   $> npm run test-build-msg
```

**Claim a channel**
A channel will be created with an initial deposit of 600 tokens. Then, a message authorizing the claim of 20 tokens will be signed, which will be used to make a claim. Another message will be signed authorizing the transfer of 60 tokens, followed by a final claim that will also close the channel.

```shell
   $> npm run test-claim
```

**Multi Claim of channels**
Two channels will be created by the same sender, which we'll refer to as A and B, with initial deposits of 100 and 20 tokens, respectively.

Two messages will be created to claim 20 tokens from channel A and 10 tokens from channel B. Both claims will be executed, and channel B will be closed.

Finally, another message will be created to claim 60 tokens from channel A, which will also result in its closure.

```shell
   $> npm run test-claim
```

**Close a channel**
```shell
   $> npm run test-close
```

**Test combined operations**
First, a channel is created with an initial deposit of 6 tokens. Then, an update adds 3 more tokens to the channel. A message for 7 tokens is signed and later used to claim the channel. Finally, the channel is closed, returning the remaining tokens to the sender.
```shell
   $> npm run test-all
```

### Test with testnet
To emulate this operations on testnet, complete the  `.test-env` file at the src with:
```js
SEED="decrease cash kangaroo ..."
```
To reduce inputs, you can complete the CONFIG_FILE with:
```js
{
   // sender's address
   "sender": "addr_test1...",
   // receiver's address
   "receiver": "addr_test1...",
   // signer's pub key hash
   "signer_pub_key": "0a0b..."
}
```

Then run:
```shell
   $> npm run cli-preview
```
And input as appropiate.

### Test with jest
To test the operations with jest, try:
```shell
   $> npm run test
```

### Test using tx3

To test the operations using tx3, first you need to set up the following tools:
- [tx3](https://github.com/tx3-lang/tx3): Using the commit fe4795ec2e649200300f787e56a3e446b82458df and applying the patch `tx3-fix.diff`.
- [dolos](https://github.com/txpipe/dolos):
- [trix](https://github.com/tx3-lang/trix): Using the v0.10.0 release and applying the patch `trix-fix.diff`
- [web-sdk](https://github.com/tx3-lang/web-sdk)
- node: Using v20.11.1

You will also need to complete the CONFIG_FILE  with:
```js
{
   // sender's address
   "sender": "addr_test1...",
   // receiver's address
   "receiver": "addr_test1...",
   // signer's pub key hash
   "signer_pub_key": "0a0b..."
}
```
Then, inside the `src/tx3-offchain` run:
```shell
   $> trix bindgen
```
Afterwards generate the blaze-blueprint:
```shell
   $> npm run generate-blueprint
```

And fix the generated `blueprint.ts` by changing the imports section the following way:
```ts
/* eslint-disable */
// @ts-nocheck
import { Type } from "@blaze-cardano/data";
import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk";
```

Run inside your `dolos` folder:
```shell
   $> cargo run --bin dolos daemon
```

**Open a channel**
To open a channel, try inside the `src` folder:
```shell
   $> npm run tx3-open
```

This will return a CBOR and a channelID. The CBOR specifies a transaction that opens a channel with:
- An initial fund of 5 `AGIX`
- Group ID `group1`
- Expiration date in one day from now
- Sender, signer and receiver as specified on the CONFIG_JSON file

It is possible to change this operation in the file `src/tx3-offchain/test/open.ts`

**Update a channel**
Given a `channel ID` an `amount` and an `expiration date`, you can obtain a CBOR to update a channel by running:
```shell
   $> npm run tx3-update -- -c <channelId> -a <amount> -e <expirationDate>
```
The amount and the expiration date are optional fields, but if none of them is completed an error will arise. By using:
```shell
   $> npm run tx3-update -- -c <channelId> -d
```
A default amount of `1 AGIX` and an expiration date to one week from now will be set.

**Build a message**
Given a `nonce`, an `amount` and a `channel ID`:
```shell
   $> npm run sign -- -c <channelId> -n <nonce> -a <amount>
```
Will return a message signed by the user specified with the seed phrase in the `.test-env` file.

**Claim and close a channel**
Given a `channel ID` a `payload` (or signed message) and an `amount` to claim, running:
```shell
   $> npm run tx3-claim-and-close -- -c <channelId> -p <payload> -a <amount>
```
Will return a CBOR that claims and closes the channel.

**Claim and continue a channel**
Given a `channel ID` a `payload` (or signed message) and an `amount` to claim, running:
```shell
   $> npm run tx3-claim -- -c <channelId> -p <payload> -a <amount>
```
Will return a CBOR that claims and closes the channel.

**Close a channel**
Given a `channel ID` from a channel, to close said channel, try:
```shell
   $> npm run tx3-close -- -c <channelId>
```