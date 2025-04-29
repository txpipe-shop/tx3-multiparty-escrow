// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { fromUnit } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { ChannelDatum } from "../../types/types.ts";
import { testOpenOperation, testUpdateOperation } from "../operations.ts";
import { setupTestEnv } from "../utils.ts";

const { sender, signer, receiver, user, lucid, emulator, scriptRef } =
  await setupTestEnv();

const expirationDate = BigInt(emulator.now() + 10 * 60 * 1000);
const initialDeposit = 6n;
const groupId = 10n;
const newExpirationDate = BigInt(emulator.now() + 20 * 60 * 1000);
const newDeposit = 10n;

const openAndUpdate = async (
  updateExpiration: boolean = true,
  updateAmount: boolean = true,
) => {
  const { channelId, openTx } = await testOpenOperation(
    {
      lucid,
      scriptRef,
      senderAddress: sender.address,
      receiverAddress: receiver.address,
      signerPubKey: signer.publicKey,
      groupId,
      expirationDate,
      initialDeposit,
      currentTime: BigInt(emulator.now()),
    },
    sender.privateKey,
    false,
  );
  const [openChannelUtxo] = await lucid.utxosByOutRef([
    { txHash: openTx, outputIndex: 0 },
  ]);
  const { updatedTx } = await testUpdateOperation(
    {
      lucid,
      scriptRef,
      userAddress: updateExpiration ? sender.address : user.address,
      senderAddress: sender.address,
      channelId,
      addDeposit: updateAmount ? newDeposit : undefined,
      expirationDate: updateExpiration ? newExpirationDate : undefined,
      currentTime: BigInt(emulator.now()),
    },
    updateExpiration ? sender.privateKey : user.privateKey,
    false,
  );
  const [updateChannelUtxo] = await lucid.utxosByOutRef([
    { txHash: updatedTx, outputIndex: 0 },
  ]);
  return { openChannelUtxo, updateChannelUtxo };
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
      expirationDate,
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

describe("Update channel tests", () => {
  it("Channel utxo has the token [scriptHash][senderAddress]", async () => {
    const { updateChannelUtxo } = await openAndUpdate();

    const channelToken = Object.keys(updateChannelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == validatorDetails(lucid).scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(sender.pubKeyHash);
  });
  it("Channel utxo only updates datum's expiration date when expiration date changes", async () => {
    const { openChannelUtxo, updateChannelUtxo } = await openAndUpdate();

    const openDatumStr = openChannelUtxo.datum!;
    const openDatum: ChannelDatum = fromChannelDatum(openDatumStr);

    const updatedDatumStr = updateChannelUtxo.datum!;
    const updatedDatum: ChannelDatum = fromChannelDatum(updatedDatumStr);

    expect(updatedDatum.expirationDate).toBe(newExpirationDate);
    expect(updatedDatum.channelId).toBe(openDatum.channelId);
    expect(updatedDatum.groupId).toBe(openDatum.groupId);
    expect(updatedDatum.nonce).toBe(openDatum.nonce);
    expect(updatedDatum.receiver).toBe(openDatum.receiver);
    expect(updatedDatum.signer).toBe(openDatum.signer);
  });
  it("Channel utxo preserves datum when expiration date does not change", async () => {
    const { openChannelUtxo, updateChannelUtxo } = await openAndUpdate(false);

    const openDatumStr = openChannelUtxo.datum!;
    const updatedDatumStr = updateChannelUtxo.datum!;
    expect(openDatumStr).toBe(updatedDatumStr);
  });
  it("Channel utxo has updated amount of tokens", async () => {
    const { updateChannelUtxo } = await openAndUpdate(false);
    const tokenAmount = updateChannelUtxo.assets[config.token];
    expect(tokenAmount).toBe(initialDeposit + newDeposit);
  });
});

describe("Attack tests", () => {
  it("Fails to update expiration date to a previous date", async () => {
    try {
      const channelId = await open();
      const { updatedTx } = await testUpdateOperation(
        {
          lucid,
          scriptRef,
          userAddress: sender.address,
          senderAddress: sender.address,
          channelId,
          expirationDate: BigInt(emulator.now() + 50 * 1000),
          currentTime: BigInt(emulator.now()),
        },
        sender.privateKey,
        false,
      );
      expect(updatedTx).toBeUndefined();
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain(
        "New expiration date must be greater than current",
      );
    }
  });
  it("Fails to update without new expiration date or additional amount", async () => {
    try {
      const channelId = await open();
      const { updatedTx } = await testUpdateOperation(
        {
          lucid,
          scriptRef,
          userAddress: sender.address,
          senderAddress: sender.address,
          channelId,
          currentTime: BigInt(emulator.now()),
        },
        sender.privateKey,
        false,
      );
      expect(updatedTx).toBeUndefined();
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Nothing to update");
    }
  });
  it("Fails to update expired channel", async () => {
    try {
      const channelId = await open();
      const { updatedTx } = await testUpdateOperation(
        {
          lucid,
          scriptRef,
          userAddress: sender.address,
          senderAddress: sender.address,
          channelId,
          currentTime: newExpirationDate,
        },
        sender.privateKey,
        false,
      );
      expect(updatedTx).toBeUndefined();
    } catch (e) {
      console.log("\x1b[31m%s\x1b[0m", String(e));
      expect(String(e)).toContain("Channel expired");
    }
  });
});
