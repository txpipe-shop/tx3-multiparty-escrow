import { Addresses, Data, Lucid, Utils } from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";
import { validatorDetails } from "../lib/utils.ts";

async function deployScript(lucid: Lucid): Promise<{ cbor: string }> {
  const cred = Addresses.inspect(await lucid.wallet.address()).payment;
  if (!cred) {
    throw new Error("Failed to get payment key hash");
  }
  const refScriptAddress = Addresses.scriptToAddress(
    lucid.network,
    lucid.newScript({
      type: "Sig",
      keyHash: cred.hash,
    }).script,
  );

  const validator = new SingularityChannelSpend();
  const { scriptRewardAddress } = validatorDetails(lucid);
  const tx = await lucid
    .newTx()
    .payToContract(
      refScriptAddress,
      {
        Inline: Data.void(),
        scriptRef: {
          type: "PlutusV3",
          script: Utils.applyDoubleCborEncoding(validator.script),
        },
      },
      {},
    )
    .registerStake(scriptRewardAddress)
    .commit();
  return { cbor: tx.toString() };
}

export { deployScript };
