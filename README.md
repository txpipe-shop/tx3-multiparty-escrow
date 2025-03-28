# MultiParty Escrow
The MultiParty Escrow (MPE) smart contract manages payment channels between **clients** —who act as senders, consumers, or service customers— and **service providers**, who serve as receivers or recipients.

## Documentation
- [Requirements](./requeriments.md)
- [Design](./design.md)

## Environment files

We need to have a `.env` file at the src with the following content:

```js
PORT = 3000
PROVIDER_PROJECT_ID = ""
PROVIDER_URL = ""
NETWORK = ""
CONFIG_FILE = ""
```

Where CONFIG_FILE is the name of a file inside the project.

```js
{
    "token": "..."
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
The tests will always consider the creation of a channel with an initial deposit of 6 tokens.

**Create an order**
```shell
   $> npm run test-open
```
**Update an order**
In this case, an order will be created and then updated.
```shell
   $> npm run test-update
```