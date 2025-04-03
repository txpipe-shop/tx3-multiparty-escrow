import { Addresses, Data, fromText, Lucid, OutRef, toUnit, Utxo } from "@spacebudz/lucid";
import { config } from "../../config.ts";
import { OpenChannelParams } from "../../shared/api-types.ts";
import {
  Channel,
  ChannelDatum,
} from "../types/types.ts";
import { toChannelDatum } from "../lib/utils.ts";

export const openChannel = async (
  lucid: Lucid,
  {
    senderAddress,
    receiverAddress,
    signerPubKey,
    groupId,
    expirationDate,
    initialDeposit,
  }: OpenChannelParams,
  scriptRef: Utxo
) => {
  lucid.selectReadOnlyWallet({ address: senderAddress });
  const utxos = await lucid.wallet.getUtxos();
  const utxo = utxos[0];
  const channelId: string = utxo.txHash + fromText(String(utxo.outputIndex)); // Check index

  const receiverPubKeyHash =
    Addresses.addressToCredential(receiverAddress).hash;

  const datum: ChannelDatum = {
    channelId,
    nonce: 0n,
    signer: signerPubKey,
    receiver: receiverPubKeyHash,
    groupId,
    expirationDate,
  };

  const validator = new Channel();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  const mintingPolicyId = Addresses.scriptToCredential(validator).hash;

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;
  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);

  const tx = await lucid
    .newTx()
    .readFrom([scriptRef])
    .collectFrom([utxo])
    .addSigner(senderPubKeyHash)
    .mint({ [channelToken]: 1n }, Data.void())
    .payToContract(
      scriptAddress,
      { Inline: toChannelDatum(datum) },
      { [config.token]: initialDeposit, [channelToken]: 1n }
    )
    .attachMetadata(674, { msg: ["Open Channel"] })
    .commit();

  return { openChannelCbor: tx.toString(), channelId };
};
