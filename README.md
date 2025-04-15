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
    "token": "640d27b6d2e02539d21bcee5cea36688b7c93f1a97ca03a5990e16dd7441676978"
}
```

## Run Instructions

### Server
For the first time, run `npm install` inside the `src` folder to install all the dependencies.

To run the server, run `npm run dev` inside the `src` folder.

### Compile validator
**Note**: Aiken must be installed. Check the `aiken.toml` file to match the correct compiler version.

Inside `onchain`, run `aiken build`.

### Generate types
Run `bash parse-blueprint.sh` to generate the contract types from the validator's blueprint.

### Tests
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
