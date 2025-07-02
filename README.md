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

#### Setup
1. Make a directory where we are going to clone all the needed repositories:
```sh
mkdir escrow-tx3
cd escrow-tx3
git clone git@github.com:txpipe-shop/tx3-multiparty-escrow.git
```
2. Set up [tx3](https://github.com/tx3-lang/tx3) repository:
```sh
git clone git@github.com:tx3-lang/tx3.git
cd tx3
git checkout fe4795ec2e649200300f787e56a3e446b82458df
git apply ../tx3-multiparty-escrow/tx3-setup-utils/tx3.diff
cd ..
```
3. Set up [trix](https://github.com/tx3-lang/trix):
```sh
git clone git@github.com:tx3-lang/trix.git
cd trix
git checkout v0.10.0
git apply ../tx3-multiparty-escrow/tx3-setup-utils/trix.diff
cd ..
```
4. Set up [dolos](https://github.com/txpipe/dolos):
```sh
git clone git@github.com:txpipe/dolos.git
cd dolos
git checkout 6b18701e08644679458bf9686ea28de356601fcb
git apply ../tx3-multiparty-escrow/tx3-setup-utils/dolos.diff
cd ..
```

5. Complete the CONFIG_FILE  with:
```js
{
   ...
   // sender's address
   "sender": "addr_test1...",
   // receiver's address
   "receiver": "addr_test1...",
   // signer's pub key hash
   "signer_pub_key": "0a0b..."
}
```
7. Make sure to use node `v20.11.1`:
```sh
cd tx3-multiparty-escrow
nvm use v20.11.1
```
8. Generate the blaze blueprint:
```shell
cd src
npm run generate-blaze-blueprint
cd ../..
```
And fix the generated `blueprint.ts` by changing the imports section the following way:
```ts
/* eslint-disable */
// @ts-nocheck
import { Type } from "@blaze-cardano/data";
import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk";
```
9. Run inside your `dolos` folder:
```shell
cd dolos
# Within the options this command shows, select the network to use
# Make sure you enable the trp server and the utxo-rpc endpoint (See the image below)
cargo run init
# To enable
cargo run daemon
```
Here's what the `init` command looks like:
![Dolos init configuration](image.png)

**Note**: Keep this terminal and don't close it.

10. Generate the proto tx. Open a new terminal and run from the `tx3-multiparty-escrow` folder:
```shell
cd src/tx3-offchain
cargo run --manifest-path "../../../trix/Cargo.toml" --quiet --bin trix -- bindgen
cd ..
```

#### Operations

**Open a channel**
Given an initial amount of `AGIX` to deposit, a `groupID`, to open a channel, try inside the `src` folder:
```shell
npm run tx3-open -- -a <initialDeposit> -g <groupId> [-s <sender>] [-r <receiver>] [-spk <signerPubKey>] [-e <expirationDate>]
```

This will return the txHash of said transaction, its CBOR and the corresponding channelID. A default expiration date to one day from now will be set, but you can change that by adding the `-e <expirationDate>` parameter with the expiration date in POSIX time.

**Update a channel**
Given a `channel ID` an `amount` and an `expiration date`, you can obtain a CBOR to update a channel by running:
```shell
npm run npm run tx3-update -- -c <channelId> [-a <amount>] [-e <expirationDate>] [-s <sender>]
```
The amount and the expiration date are optional fields, but if none of them is completed an error will arise. By using:
```shell
npm run tx3-update -- -c <channelId> -d
```
A default amount of `1 AGIX` and an expiration date to one week from now will be set.

**Build a message**
Given a `nonce`, an `amount` and a `channel ID`:
```shell
npm run sign -- -c <channelId> -n <nonce> -a <amount>
```
Will return a message signed by the user specified with the seed phrase in the `.test-env` file.

**Claim a channel**
Given a `channel ID` a `payload` (or signed message) and an `amount` to claim, run the following:
```shell
npm run tx3-claim -- -c <channelId> -p <payload> -a <amount> -f <finalize> [-s <sender>] [-r <receiver>]
```
The `-f <finalize>` parameter indicates whether the channel will be closed or not after the claiming action.

**Close a channel**
Given a `channel ID` from a channel, to close said channel, try:
```shell
npm run tx3-close -- -c <channelId> [-s <sender>]
```