// deno-lint-ignore-file no-explicit-any
import { describe, expect, it } from "@jest/globals";
import {
  fromChannelDatum,
  toChannelDatum,
  validatorDetails,
} from "../../lib/utils.ts";
import { testClaimOperation, testOpenOperation } from "../operations.ts";
import { getCMLPrivateKey, setupTestEnv, signMessage } from "../utils.ts";
import { ClaimChannelParams } from "../../../shared/api-types.ts";
import { buildMessage } from "../../builders/build-message.ts";
import { fromUnit } from "@spacebudz/lucid";

const { sender, signer, receiver, lucid, scriptRef } = await setupTestEnv();

const { openTx, channelId } = await testOpenOperation(
  {
    lucid: lucid,
    scriptRef,
    senderAddress: sender.address,
    receiverAddress: receiver.address,
    signerPubKey: signer.publicKey,
    groupId: 10n,
    expirationDate: BigInt(Date.now() + 50 * 1000),
    initialDeposit: 600000n,
  },
  sender.privateKey,
  false
);
const { scriptHash } = validatorDetails(lucid);
const [openChannelUtxo] = await lucid.utxosByOutRef([
  { txHash: openTx, outputIndex: 0 },
]);
const {
  nonce,
  signer: signerInDatum,
  receiver: receiverInDatum,
  groupId,
  expirationDate,
} = fromChannelDatum(openChannelUtxo.datum!);

//
// TESTS
//
describe("Claim happy path tests", () => {
  it("Single claim: output is correct", async () => {
    const amount = 100n;
    const { payload } = await buildMessage(lucid, {
      channelId,
      amount,
      senderAddress: sender.address,
    });
    const signature = await signMessage(getCMLPrivateKey(sender.seed), payload);
    const claims: ClaimChannelParams = [
      {
        senderAddress: sender.address,
        channelId,
        amount,
        signature,
        finalize: false,
      },
    ];
    const { claimTx } = await testClaimOperation(
      {
        lucid,
        scriptRef,
        listOfClaims: claims,
        currentTime: BigInt(Date.now()),
        receiverAddress: receiver.address,
      },
      sender.privateKey,
      false
    );
    const [claimUtxo] = await lucid.utxosByOutRef([
      { txHash: claimTx, outputIndex: 0 },
    ]);
    const newDatum = fromChannelDatum(claimUtxo.datum!);
    const channelToken = Object.keys(claimUtxo.assets).find(
      (asset) => fromUnit(asset).policyId == scriptHash
    );
    if (!channelToken) throw new Error("Channel token not found");
    expect(fromUnit(channelToken).name).toBe(sender.pubKeyHash);
    expect(newDatum.nonce).toBe(nonce + 1n);
    expect(newDatum.signer).toBe(signerInDatum);
    expect(newDatum.receiver).toBe(receiverInDatum);
    expect(newDatum.groupId).toBe(groupId);
    expect(newDatum.expirationDate).toBe(expirationDate);
  });
});
