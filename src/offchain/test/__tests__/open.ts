// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { fromText, fromUnit } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { ChannelDatum } from "../../types/types.ts";
import { testOpenOperation } from "../operations.ts";
import { setupTestEnv } from "../utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();

//
// TESTS
//
describe("Attack tests", () => {
  it("Fails to open an expired channel", async () => {
    try {
      const channelId = await testOpenOperation(
        {
          lucid: lucid,
          scriptRef,
          senderAddress: sender.address,
          receiverAddress: receiver.address,
          signerPubKey: signer.publicKey,
          groupId: 10n,
          expirationDate: BigInt(emulator.now() - 50 * 1000),
          initialDeposit: 6n,
        },
        sender.privateKey,
        false,
      );
      expect(channelId).toBeUndefined();
    } catch (e) {
      console.log("\x1b[32m%s\x1b[0m", "Test: Open channel already expired.\n");
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Expiration date is in the past");
    }
  });
});

describe("Open channel happy path tests", () => {
  it("Has an output with the token [scriptHash][senderAddress]", async () => {
    const { openTx } = await testOpenOperation(
      {
        lucid: lucid,
        scriptRef,
        senderAddress: sender.address,
        receiverAddress: receiver.address,
        signerPubKey: signer.publicKey,
        groupId: 10n,
        expirationDate: BigInt(emulator.now() + 50 * 1000),
        initialDeposit: 6n,
      },
      sender.privateKey,
      false,
    );
    const { scriptHash } = validatorDetails(lucid);
    const [channelUtxo] = await lucid.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(sender.pubKeyHash);
  });
  it("Has an output with the correct datum", async () => {
    const expirationDate = BigInt(emulator.now() + 10 * 60 * 1000);
    const groupId = 10n;
    const initialDeposit = 6n;
    const senderUtxos = await lucid.wallet.getUtxos();
    const { channelId, openTx } = await testOpenOperation(
      {
        lucid: lucid,
        scriptRef,
        senderAddress: sender.address,
        receiverAddress: receiver.address,
        signerPubKey: signer.publicKey,
        groupId,
        expirationDate,
        initialDeposit,
      },
      sender.privateKey,
      false,
    );
    const [channelUtxo] = await lucid.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const datumStr = channelUtxo.datum!;
    const datum: ChannelDatum = fromChannelDatum(datumStr);

    const channelIdIsValid =
      senderUtxos[0].txHash + fromText(String(senderUtxos[0].outputIndex)) ==
      channelId;
    expect(channelIdIsValid).toBe(true);
    expect(datum.nonce).toBe(0n);
    expect(datum.signer).toBe(signer.publicKey);
    expect(datum.receiver).toBe(receiver.pubKeyHash);
    expect(datum.groupId).toBe(groupId);
    expect(datum.expirationDate).toBe(expirationDate);
  });
  it("Has a correct amount of tokens", async () => {
    const expirationDate = BigInt(emulator.now() + 10 * 60 * 1000);
    const initialDeposit = 6n;
    const { openTx } = await testOpenOperation(
      {
        lucid: lucid,
        scriptRef,
        senderAddress: sender.address,
        receiverAddress: receiver.address,
        signerPubKey: signer.publicKey,
        groupId: 10n,
        expirationDate,
        initialDeposit,
      },
      sender.privateKey,
      false,
    );
    const [channelUtxo] = await lucid.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const tokenAmount = channelUtxo.assets[config.token];
    expect(tokenAmount).toBe(6n);
  });
});
