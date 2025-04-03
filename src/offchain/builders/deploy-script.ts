import {
  Addresses,
  Data,
  Lucid,
  Utils,
} from "@spacebudz/lucid";
import { SingularityChannelSpend } from "../types/plutus.ts";

async function deployScript(
  lucid: Lucid
): Promise<{ txDeployHash: string }> {
  const cred = Addresses.inspect(await lucid.wallet.address()).payment;
  if (!cred) {
    throw new Error("Failed to get payment key hash");
  }
  const refScriptAddress = Addresses.scriptToAddress(
    lucid.network,
    lucid.newScript({
      type: "Sig",
      keyHash: cred.hash,
    }).script
  );

  const validator = new SingularityChannelSpend();
  const txDeployHash = await lucid
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
      {}
    )
    .commit()
    .then((txComp) => {
      return txComp.sign().commit();
    })
    .then((txSigned) => txSigned.submit());

  lucid.awaitTx(txDeployHash);
  return { txDeployHash };
}

export { deployScript };
