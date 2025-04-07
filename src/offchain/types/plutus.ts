// deno-lint-ignore-file
import {
  applyParamsToScript,
  Data,
  Script,
} from "@spacebudz/lucid";

export type ByteArray = string;
export type Int = bigint;
export type AikenCryptoVerificationKey = string;
export type TypesAction = "Update" | {
  Claim: { amount: Int; signature: ByteArray };
} | "Close";
export type TypesDatum = {
  channelId: ByteArray;
  nonce: Int;
  signer: ByteArray;
  receiver: AikenCryptoVerificationKey;
  groupId: Int;
  expirationDate: Int;
};

const definitions = {
  "ByteArray": { "dataType": "bytes" },
  "Data": { "title": "Data", "description": "Any Plutus data." },
  "Int": { "dataType": "integer" },
  "aiken/crypto/VerificationKey": {
    "title": "VerificationKey",
    "dataType": "bytes",
  },
  "types/Action": {
    "title": "Action",
    "anyOf": [{
      "title": "Update",
      "dataType": "constructor",
      "index": 0,
      "fields": [],
    }, {
      "title": "Claim",
      "dataType": "constructor",
      "index": 1,
      "fields": [{ "title": "amount", "$ref": "#/definitions/Int" }, {
        "title": "signature",
        "$ref": "#/definitions/ByteArray",
      }],
    }, {
      "title": "Close",
      "dataType": "constructor",
      "index": 2,
      "fields": [],
    }],
  },
  "types/Datum": {
    "title": "Datum",
    "anyOf": [{
      "title": "Datum",
      "dataType": "constructor",
      "index": 0,
      "fields": [
        { "title": "channelId", "$ref": "#/definitions/ByteArray" },
        { "title": "nonce", "$ref": "#/definitions/Int" },
        { "title": "signer", "$ref": "#/definitions/ByteArray" },
        {
          "title": "receiver",
          "$ref": "#/definitions/aiken/crypto/VerificationKey",
        },
        { "title": "groupId", "$ref": "#/definitions/Int" },
        { "title": "expirationDate", "$ref": "#/definitions/Int" },
      ],
    }],
  },
};

export interface SingularityChannelMint {
  new (): Script;
  redeemer: Data;
}

export const SingularityChannelMint = Object.assign(
  function () {
    return {
      type: "PlutusV3",
      script:
        "58e101010029800aba2aba1aab9faab9eaab9dab9a488888966002646465300130053754003300800398040012444b30013370e9000001c4c9289bae300b3009375400915980099b874800800e2653001300c00198061806800cc024dd50014528a4444b30013370e90000014566002601c6ea801a00316403d15980099b874800800a264646644b30013015003802c590131bae3012001375a60240046024002601c6ea801a2b30013370e90020014566002601c6ea801a00316403d164030806100c0c024dd5002459007200e18039804000980380098019baa0078a4d1365640041",
    };
  },
  { redeemer: { "shape": { "$ref": "#/definitions/Data" }, definitions } },
) as unknown as SingularityChannelMint;

export interface SingularityChannelSpend {
  new (): Script;
  datum: TypesDatum;
  redeemer: TypesAction;
}

export const SingularityChannelSpend = Object.assign(
  function () {
    return {
      type: "PlutusV3",
      script:
        "58e101010029800aba2aba1aab9faab9eaab9dab9a488888966002646465300130053754003300800398040012444b30013370e9000001c4c9289bae300b3009375400915980099b874800800e2653001300c00198061806800cc024dd50014528a4444b30013370e90000014566002601c6ea801a00316403d15980099b874800800a264646644b30013015003802c590131bae3012001375a60240046024002601c6ea801a2b30013370e90020014566002601c6ea801a00316403d164030806100c0c024dd5002459007200e18039804000980380098019baa0078a4d1365640041",
    };
  },
  { datum: { "shape": { "$ref": "#/definitions/types/Datum" }, definitions } },
  {
    redeemer: {
      "shape": { "$ref": "#/definitions/types/Action" },
      definitions,
    },
  },
) as unknown as SingularityChannelSpend;
