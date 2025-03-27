# multyparty-escrow

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
