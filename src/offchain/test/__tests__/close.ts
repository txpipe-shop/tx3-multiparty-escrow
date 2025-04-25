// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { config } from "../../../config.ts";
import { validatorDetails } from "../../lib/utils.ts";
import { testCloseChannel, testOpenOperation } from "../operations.ts";
import { setupTestEnv } from "../utils.ts";

const { sender, signer, receiver, lucid, emulator, scriptRef } =
  await setupTestEnv();

const initialDeposit = 6n;
const groupId = 10n;

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
  return { senderUtxo };
};

//
// TESTS
//

describe("Close channel tests", () => {
  it("Utxo does not have the channel token", async () => {
    const { senderUtxo } = await openAndClose();

    const channelTokenExists = Object.keys(senderUtxo.assets).includes(
      validatorDetails(lucid).scriptHash + sender.pubKeyHash,
    );
    expect(channelTokenExists).toBe(false);
  });
  it("Sender has remaining tokens from channel", async () => {
    const { senderUtxo } = await openAndClose();
    const tokenAmount = senderUtxo.assets[config.token];
    expect(tokenAmount).toBe(initialDeposit);
  });
});
