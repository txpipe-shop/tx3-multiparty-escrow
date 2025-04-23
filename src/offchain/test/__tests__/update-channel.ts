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

const lucid = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: s1PrivKey },
});

const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
const initialDeposit = 6n;
const groupId = 10n;
const newExpirationDate = BigInt(Date.now() + 20 * 60 * 1000);
const newDeposit = 10n;
const scriptRef = await getScriptRef(lucid, s1PrivKey);

const openAndUpdate = async (
  updateExpiration: boolean = true,
  updateAmount: boolean = true,
) => {
  const { channelId, openTx } = await testOpenOperation(
    {
      lucid,
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
  const [openChannelUtxo] = await lucid.utxosByOutRef([
    { txHash: openTx, outputIndex: 0 },
  ]);
  const { updatedTx } = await testUpdateOperation(
    {
      lucid,
      scriptRef,
      userAddress: updateExpiration ? s1Addr : s2Addr,
      senderAddress: s1Addr,
      channelId,
      addDeposit: updateAmount ? newDeposit : undefined,
      expirationDate: updateExpiration ? newExpirationDate : undefined,
      currentTime: BigInt(Date.now()),
    },
    updateExpiration ? s1PrivKey : s2PrivKey,
    false,
  );
  const [updateChannelUtxo] = await lucid.utxosByOutRef([
    { txHash: updatedTx, outputIndex: 0 },
  ]);
  return { openChannelUtxo, updateChannelUtxo };
};

describe("Update channel tests", () => {
  it("Channel utxo has the token [scriptHash][senderAddress]", async () => {
    const { updateChannelUtxo } = await openAndUpdate();

    const channelToken = Object.keys(updateChannelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == validatorDetails(lucid).scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(s1PubKey);
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
