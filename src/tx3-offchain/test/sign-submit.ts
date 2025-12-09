import {
    NetworkId,
    wordlist,
    mnemonicToEntropy,
    Bip32PrivateKey,
    Transaction,
    TxCBOR,
    fromHex } from "@blaze-cardano/core";
import {
    HotWallet,
    Blaze,
} from "@blaze-cardano/sdk";
import { U5C } from "@utxorpc/blaze-provider";
import assert from "assert";
import { testEnv } from "../../config.ts";
import {
  AxiosError
} from "axios";
import axios from "axios";

const args = process.argv.slice(2);

export async function submitToNode(submitApiUrl: string, cbors: string[]) {
  const txIds: string[] = [];
  for (const cbor of cbors) {
    const txId = await axios
      .post(submitApiUrl, fromHex(cbor), {
        method: "POST",
        headers: { "Content-Type": "application/cbor" },
      })
      .then(() => {
        const tx = Transaction.fromCbor(TxCBOR(cbor));
        return tx.getId();
      })
    txIds.push(txId);
  }
  return txIds;
}

assert(
    args.length === 1
    , "USAGE: npm run sign-submit -- <CBOR> "
);

const cbor = args[0];
console.log(cbor);
const seed = testEnv.SEED;
const provider = new U5C({
  url: "http://localhost:50051",
  network: NetworkId.Testnet,
});

// Setting up Wallet for signing the transaction
const entropy = mnemonicToEntropy(seed, wordlist);
const masterkey = Bip32PrivateKey.fromBip39Entropy(
      Buffer.from(entropy),
      "",
    );
const wallet = await HotWallet.fromMasterkey(
      masterkey.hex(),
      provider,
      provider.network,
    );
const blaze = await Blaze.from(provider, wallet);

//Signing the transaction
const txParsed = Transaction.fromCbor(TxCBOR(cbor));
const sign = await blaze.signTransaction(txParsed);
console.log('Signed transaction', sign.toCbor())
//const txHash = await blaze.submitTransaction(sign);
try {
  const txHash = await submitToNode("https://submitapi1yaqkke2ju6yrv97hz02.submitapi-m1.demeter.run/api/submit/tx"
                                 , [sign.toCbor().toString()]);
  console.log('Submitted Tx', txHash);
  }
catch(err : any){
  console.dir(err.response.data, {depth: null} );
  console.log("error on submit");
}

