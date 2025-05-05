// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { config } from "../../../config.ts";
import { validatorDetails } from "../../lib/utils.ts";
import { testCloseChannel, testOpenOperation } from "../operations.ts";
import { setupTestEnv } from "../utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();

const initialDeposit = 6n;
const groupId = "group1";

const openAndClose = async () => {
  const { channelId } = await testOpenOperation(
    {
      lucid,
      scriptRef,
      senderAddress: sender.address,
      receiverAddress: receiver.address,
      signerPubKey: signer.publicKey,
      groupId,
      expirationDate: BigInt(emulator.now() + 1000),
      initialDeposit,
      currentTime: BigInt(emulator.now()),
    },
    sender.privateKey,
    false,
  );
  const { closedTx } = await testCloseChannel(
    {
      lucid,
      scriptRef,
      senderAddress: sender.address,
      channelId,
      currentTime: BigInt(emulator.now() + 60 * 1000),
    },
    sender.privateKey,
    false,
  );
  const [senderUtxo] = await lucid.utxosByOutRef([
    { txHash: closedTx, outputIndex: 0 },
  ]);
  const utxosWithChannelToken = await lucid.utxoByUnit(
    validatorDetails(lucid).scriptHash + sender.pubKeyHash,
  );
  return { senderUtxo, utxosWithChannelToken };
};

const open = async () => {
  const { channelId } = await testOpenOperation(
    {
      lucid,
      scriptRef,
      senderAddress: sender.address,
      receiverAddress: receiver.address,
      signerPubKey: signer.publicKey,
      groupId,
      expirationDate: BigInt(emulator.now() + 10 * 60 * 1000),
      initialDeposit,
      currentTime: BigInt(emulator.now()),
    },
    sender.privateKey,
    false,
  );
  return channelId;
};

//
// TESTS
//

describe("Close channel tests", () => {
  it("Utxo does not have the channel token", async () => {
    const { utxosWithChannelToken } = await openAndClose();
    expect(utxosWithChannelToken).toBe(undefined);
  });
  it("Sender has remaining tokens from channel", async () => {
    const { senderUtxo } = await openAndClose();
    const tokenAmount = senderUtxo.assets[config.token];
    expect(tokenAmount).toBe(initialDeposit);
  });
});

describe("Attack tests", () => {
  it("Fails to close an active channel", async () => {
    try {
      const channelId = await open();
      const { closedTx } = await testCloseChannel(
        {
          lucid,
          scriptRef,
          senderAddress: sender.address,
          channelId,
          currentTime: BigInt(emulator.now()),
        },
        sender.privateKey,
        false,
      );
      expect(closedTx).toBeUndefined();
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Channel has not expired yet");
    }
  });
});
