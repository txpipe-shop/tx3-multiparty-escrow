import { Addresses, Data, fromText, Lucid, toUnit } from "@spacebudz/lucid";
import { TypesDatum, SingularityChannelMint, SingularityChannelSpend } from "../types/plutus.ts";
import { AGIX, label } from "../lib/utils.ts";

export const openChannel = async (
  lucid: Lucid,
  senderAddress: string,
  signerPubKey: string,
  receiverAddress: string,
  initialDeposit: bigint,
  expirationDate: bigint,
  groupId: bigint
) => {
  const utxos = await lucid.wallet.getUtxos();
  const utxo = utxos[0];
  const channelId: string = utxo.txHash + fromText(String(utxo.outputIndex)); // Check index

  const receiverPubKeyHash =
    Addresses.addressToCredential(receiverAddress).hash;

  const datum: TypesDatum = {
    channelId,
    nonce: 0n,
    signer: signerPubKey,
    receiver: receiverPubKeyHash,
    groupId,
    expirationDate,
  };

  const validator = new SingularityChannelMint();
  const scriptAddress = Addresses.scriptToAddress(lucid.network, validator);
  const mintingPolicyId = Addresses.scriptToCredential(validator).hash;

  const senderPubKeyHash = Addresses.addressToCredential(senderAddress).hash;
  const channelToken = toUnit(mintingPolicyId, senderPubKeyHash);

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .attachScript(validator)
    .addSigner(senderPubKeyHash) // Third party?
    .mint({ [channelToken]: 1n }, Data.void())
    .payToContract(
      scriptAddress,
      { Inline: Data.to(datum, SingularityChannelSpend.datum) },
      { [AGIX]: initialDeposit }
    )
    .attachMetadata(label, { msg: ["Open Channel"] })
    .commit();

  return { cbor: tx.toString(), channelId };
};
