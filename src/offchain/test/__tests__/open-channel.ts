// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import { Emulator, fromText, fromUnit, Lucid } from "@spacebudz/lucid";
import { config } from "../../../config.ts";
import { fromChannelDatum, validatorDetails } from "../../lib/utils.ts";
import { ChannelDatum } from "../../types/types.ts";
import { testOpenOperation } from "../operations.ts";
import { getRandomUser, getScriptRef } from "../utils.ts";

const {
  privateKey: s1PrivKey,
  pubKeyHash: s1PubKey,
  address: s1Addr,
} = getRandomUser();
const { pubKeyHash: rPubKey, address: rAddr } = getRandomUser();

const emulator = new Emulator([
  { address: s1Addr, assets: { lovelace: 30_000_000n, [config.token]: 50n } },
]);

const lucid = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: s1PrivKey },
});

describe("Open channel happy path tests", () => {
  it("Has an output with the token [scriptHash][senderAddress]", async () => {
    const scriptRef = await getScriptRef(lucid, s1PrivKey);
    await testOpenOperation(
      {
        lucid,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId: 10n,
        expirationDate: BigInt(Date.now() + 50 * 1000),
        initialDeposit: 6n,
      },
      s1PrivKey,
      false,
    );
    const { scriptAddress, scriptHash } = validatorDetails(lucid);
    const utxosAtScript = await lucid.utxosAt(scriptAddress);
    const channelUtxo = utxosAtScript[0];
    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(s1PubKey);
  });
  it("Has an output with the correct datum", async () => {
    const scriptRef = await getScriptRef(lucid, s1PrivKey);

    const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
    const groupId = 10n;
    const initialDeposit = 6n;
    const senderUtxos = await lucid.wallet.getUtxos();
    const { channelId, openTx } = await testOpenOperation(
      {
        lucid: lucid,
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
    expect(datum.signer).toBe(s1PubKey);
    expect(datum.receiver).toBe(rPubKey);
    expect(datum.groupId).toBe(groupId);
    expect(datum.expirationDate).toBe(expirationDate);
  });
  it("Has an correct amount of tokens", async () => {
    const scriptRef = await getScriptRef(lucid, s1PrivKey);

    const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
    const initialDeposit = 6n;
    const { openTx } = await testOpenOperation(
      {
        lucid: lucid,
        scriptRef,
        senderAddress: s1Addr,
        receiverAddress: rAddr,
        signerPubKey: s1PubKey,
        groupId: 10n,
        expirationDate,
        initialDeposit,
      },
      s1PrivKey,
      false,
    );
    const [channelUtxo] = await lucid.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const tokenAmount = channelUtxo.assets[config.token];
    expect(tokenAmount).toBe(6n);
  });
});
