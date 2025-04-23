// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { Emulator, fromUnit, Lucid } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { ChannelDatum } from "../../types/types.ts";
import { testOpenOperation, testUpdateOperation } from "../operations.ts";
import { getRandomUser, getScriptRef } from "../utils.ts";

const {
  privateKey: s1PrivKey,
  pubKeyHash: s1PubKey,
  address: s1Addr,
} = getRandomUser();
const { privateKey: s2PrivKey, address: s2Addr } = getRandomUser();
const { address: rAddr } = getRandomUser();

const emulator = new Emulator([
  { address: s1Addr, assets: { lovelace: 30_000_000n, [config.token]: 70n } },
  { address: s2Addr, assets: { lovelace: 60_000_000n, [config.token]: 50n } },
]);

const lucids1 = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: s1PrivKey },
});
const lucids2 = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: s2PrivKey },
});

const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
const initialDeposit = 6n;
const groupId = 10n;
const newExpirationDate = BigInt(Date.now() + 20 * 60 * 1000);
const newDeposit = 10n;

describe("Update channel tests", () => {
  it("Channel utxo has the token [scriptHash][senderAddress]", async () => {
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);
    const { channelId } = await testOpenOperation(
      {
        lucid: lucids1,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId,
        expirationDate,
        initialDeposit,
      },
      s1PrivKey,
      false,
    );
    const { updatedTx } = await testUpdateOperation(
      {
        lucid: lucids2,
        scriptRef,
        userAddress: s2Addr,
        senderAddress: s1Addr,
        channelId,
        addDeposit: newDeposit,
        currentTime: BigInt(Date.now()),
      },
      s2PrivKey,
      false,
    );
    const [channelUtxo] = await lucids1.utxosByOutRef([
      { txHash: updatedTx, outputIndex: 0 },
    ]);
    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) =>
        fromUnit(asset).policyId == validatorDetails(lucids1).scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(s1PubKey);
  });
  it("Channel utxo only updates datum's expiration date when expiration date changes", async () => {
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);
    const { channelId, openTx } = await testOpenOperation(
      {
        lucid: lucids1,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId,
        expirationDate,
        initialDeposit,
      },
      s1PrivKey,
      false,
    );
    const [openChannelUtxo] = await lucids1.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const openDatumStr = openChannelUtxo.datum!;
    const openDatum: ChannelDatum = fromChannelDatum(openDatumStr);
    const { updatedTx } = await testUpdateOperation(
      {
        lucid: lucids1,
        scriptRef,
        userAddress: s1Addr,
        senderAddress: s1Addr,
        channelId,
        addDeposit: newDeposit,
        expirationDate: newExpirationDate,
        currentTime: BigInt(Date.now()),
      },
      s1PrivKey,
      false,
    );
    const [updatedChannelUtxo] = await lucids1.utxosByOutRef([
      { txHash: updatedTx, outputIndex: 0 },
    ]);
    const updatedDatumStr = updatedChannelUtxo.datum!;
    const updatedDatum: ChannelDatum = fromChannelDatum(updatedDatumStr);

    expect(updatedDatum.expirationDate).toBe(newExpirationDate);
    expect(updatedDatum.channelId).toBe(openDatum.channelId);
    expect(updatedDatum.groupId).toBe(openDatum.groupId);
    expect(updatedDatum.nonce).toBe(openDatum.nonce);
    expect(updatedDatum.receiver).toBe(openDatum.receiver);
    expect(updatedDatum.signer).toBe(openDatum.signer);
  });
  it("Channel utxo preserves datum when expiration date does not change", async () => {
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);
    const { channelId, openTx } = await testOpenOperation(
      {
        lucid: lucids1,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId,
        expirationDate,
        initialDeposit,
      },
      s1PrivKey,
      false,
    );
    const [openChannelUtxo] = await lucids1.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const openDatumStr = openChannelUtxo.datum!;
    const { updatedTx } = await testUpdateOperation(
      {
        lucid: lucids2,
        scriptRef,
        userAddress: s2Addr,
        senderAddress: s1Addr,
        channelId,
        addDeposit: newDeposit,
        currentTime: BigInt(Date.now()),
      },
      s2PrivKey,
      false,
    );
    const [updatedChannelUtxo] = await lucids2.utxosByOutRef([
      { txHash: updatedTx, outputIndex: 0 },
    ]);
    const updatedDatumStr = updatedChannelUtxo.datum!;
    expect(updatedDatumStr).toBe(openDatumStr);
  });
  it("Channel utxo has updated amount of tokens", async () => {
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);

    const { channelId } = await testOpenOperation(
      {
        lucid: lucids1,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId,
        expirationDate,
        initialDeposit,
      },
      s1PrivKey,
      false,
    );
    const { updatedTx } = await testUpdateOperation(
      {
        lucid: lucids2,
        scriptRef,
        userAddress: s2Addr,
        senderAddress: s1Addr,
        channelId,
        addDeposit: newDeposit,
        currentTime: BigInt(Date.now()),
      },
      s2PrivKey,
      false,
    );
    const [channelUtxo] = await lucids2.utxosByOutRef([
      { txHash: updatedTx, outputIndex: 0 },
    ]);
    const tokenAmount = channelUtxo.assets[config.token];
    expect(tokenAmount).toBe(initialDeposit + newDeposit);
  });
});
