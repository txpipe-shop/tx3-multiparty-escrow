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
  groupId: ByteArray;
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
          { title: "groupId", $ref: "#/definitions/ByteArray" },
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
        "5901a001010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c966002646465300130073754003300a00398050012444b30013370e9000001c4c9289bae300d300b375400913259800980080244c8cc896600200b133225980099b87480000062b30013011375400f002806a0248acc004c018006264b300100180744c96600200300f807c03e26644b3001001808c4c966002003012809404a0251332259800800c052264b30010018992cc004c0680062b3001337129002180c800c05a264b3001301e004806405d01c1807980c800a02e80b2036375400301580ac05602a80e8c0680050191bae00130190024068602e00280b0dd6800980b001403d017180a000a0263011375400f15980099b87480100062b30013011375400f002806a024806a01c4038807052898071baa005805c02e01700b404c601e002601e602000260186ea80162c8048dc3a40048040601260140026012002600a6ea802a293454cc00d24011856616c696461746f722072657475726e65642066616c7365001365640082a6600492011072656465656d65723a20416374696f6e001601",
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
        "5901a001010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c966002646465300130073754003300a00398050012444b30013370e9000001c4c9289bae300d300b375400913259800980080244c8cc896600200b133225980099b87480000062b30013011375400f002806a0248acc004c018006264b300100180744c96600200300f807c03e26644b3001001808c4c966002003012809404a0251332259800800c052264b30010018992cc004c0680062b3001337129002180c800c05a264b3001301e004806405d01c1807980c800a02e80b2036375400301580ac05602a80e8c0680050191bae00130190024068602e00280b0dd6800980b001403d017180a000a0263011375400f15980099b87480100062b30013011375400f002806a024806a01c4038807052898071baa005805c02e01700b404c601e002601e602000260186ea80162c8048dc3a40048040601260140026012002600a6ea802a293454cc00d24011856616c696461746f722072657475726e65642066616c7365001365640082a6600492011072656465656d65723a20416374696f6e001601",
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
