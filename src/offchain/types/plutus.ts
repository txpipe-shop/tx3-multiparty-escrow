// deno-lint-ignore-file
import { Data, Script } from "@spacebudz/lucid";

export type Bool = boolean;
export type ByteArray = string;
export type Int = bigint;
export type AikenCryptoVerificationKey = string;
export type TypesAction =
  | "Update"
  | {
      Claim: { amount: Int; signature: ByteArray; finalize: Bool };
    }
  | "Close";
export type TypesDatum = {
  channelId: ByteArray;
  nonce: Int;
  signer: ByteArray;
  receiver: AikenCryptoVerificationKey;
  groupId: Int;
  expirationDate: Int;
};

const definitions = {
  Bool: {
    title: "Bool",
    anyOf: [
      {
        title: "False",
        dataType: "constructor",
        index: 0,
        fields: [],
      },
      {
        title: "True",
        dataType: "constructor",
        index: 1,
        fields: [],
      },
    ],
  },
  ByteArray: { dataType: "bytes" },
  Data: { title: "Data", description: "Any Plutus data." },
  Int: { dataType: "integer" },
  "aiken/crypto/VerificationKey": {
    title: "VerificationKey",
    dataType: "bytes",
  },
  "types/Action": {
    title: "Action",
    anyOf: [
      {
        title: "Update",
        dataType: "constructor",
        index: 0,
        fields: [],
      },
      {
        title: "Claim",
        dataType: "constructor",
        index: 1,
        fields: [
          { title: "amount", $ref: "#/definitions/Int" },
          {
            title: "signature",
            $ref: "#/definitions/ByteArray",
          },
          { title: "finalize", $ref: "#/definitions/Bool" },
        ],
      },
      {
        title: "Close",
        dataType: "constructor",
        index: 2,
        fields: [],
      },
    ],
  },
  "types/Datum": {
    title: "Datum",
    anyOf: [
      {
        title: "Datum",
        dataType: "constructor",
        index: 0,
        fields: [
          { title: "channelId", $ref: "#/definitions/ByteArray" },
          { title: "nonce", $ref: "#/definitions/Int" },
          { title: "signer", $ref: "#/definitions/ByteArray" },
          {
            title: "receiver",
            $ref: "#/definitions/aiken/crypto/VerificationKey",
          },
          { title: "groupId", $ref: "#/definitions/Int" },
          { title: "expirationDate", $ref: "#/definitions/Int" },
        ],
      },
    ],
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
        "59010c01010029800aba2aba1aab9faab9eaab9dab9a488888966002646465300130053754003300800398040012444b30013370e9000001c4c9289bae300b3009375400913259800980080244ca6002601a003300d300e00198051baa0038a51488896600266e1d20000028acc004c03cdd5003c0062c80822b3001300600289919194c004c966002602600315980099b8948010c0480062d1300a301200140451640506ea8c0500066eb4c05000e6eb8c05000922259800980c002401e2c80b060280026026002601e6ea801e2b30013370e90020014566002601e6ea801e003164041164034806900d0c028dd5002c590081b87480090070c01cc020004c01c004c00cdd5003c52689b2b200201",
    };
  },
  { redeemer: { shape: { $ref: "#/definitions/Data" }, definitions } },
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
        "59010c01010029800aba2aba1aab9faab9eaab9dab9a488888966002646465300130053754003300800398040012444b30013370e9000001c4c9289bae300b3009375400913259800980080244ca6002601a003300d300e00198051baa0038a51488896600266e1d20000028acc004c03cdd5003c0062c80822b3001300600289919194c004c966002602600315980099b8948010c0480062d1300a301200140451640506ea8c0500066eb4c05000e6eb8c05000922259800980c002401e2c80b060280026026002601e6ea801e2b30013370e90020014566002601e6ea801e003164041164034806900d0c028dd5002c590081b87480090070c01cc020004c01c004c00cdd5003c52689b2b200201",
    };
  },
  { datum: { shape: { $ref: "#/definitions/types/Datum" }, definitions } },
  {
    redeemer: {
      shape: { $ref: "#/definitions/types/Action" },
      definitions,
    },
  },
) as unknown as SingularityChannelSpend;
