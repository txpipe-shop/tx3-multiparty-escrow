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
const { address: s2Addr } = getRandomUser();
const { pubKeyHash: rPubKey, address: rAddr } = getRandomUser();

const emulator = new Emulator([
  { address: s1Addr, assets: { lovelace: 30_000_000n, [config.token]: 50n } },
  { address: s2Addr, assets: { lovelace: 60_000_000n, [config.token]: 100n } },
]);

const lucids1 = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: s1PrivKey },
});

//
// TESTS
//
describe("Attack tests", () => {
  it("Fails to open an expired channel", async () => {
    try {
      const scriptRef = await getScriptRef(lucids1, s1PrivKey);

      const { channelId } = await testOpenOperation(
        {
          lucid: lucids1,
          scriptRef,
          senderAddress: s1Addr,
          receiverAddress: rAddr,
          signerPubKey: s1PubKey,
          groupId: 10n,
          expirationDate: BigInt(Date.now() - 50 * 1000),
          initialDeposit: 6n,
        },
        s1PrivKey,
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
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);
    await testOpenOperation(
      {
        lucid: lucids1,
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
    const { scriptAddress, scriptHash } = validatorDetails(lucids1);
    const utxosAtScript = await lucids1.utxosAt(scriptAddress);
    const channelUtxo = utxosAtScript[0]; // Should we find it or assume its the fist one?
    const channelToken = Object.keys(channelUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash,
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(s1PubKey);
  });
  it("Has an output with the correct datum", async () => {
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);

    const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
    const groupId = 10n;
    const initialDeposit = 6n;
    const senderUtxos = await lucids1.wallet.getUtxos();
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
    const [channelUtxo] = await lucids1.utxosByOutRef([
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
    const scriptRef = await getScriptRef(lucids1, s1PrivKey);

    const expirationDate = BigInt(Date.now() + 10 * 60 * 1000);
    const initialDeposit = 6n;
    const { openTx } = await testOpenOperation(
      {
        lucid: lucids1,
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
    const [channelUtxo] = await lucids1.utxosByOutRef([
      { txHash: openTx, outputIndex: 0 },
    ]);
    const tokenAmount = channelUtxo.assets[config.token];
    expect(tokenAmount).toBe(6n);
  });
});
