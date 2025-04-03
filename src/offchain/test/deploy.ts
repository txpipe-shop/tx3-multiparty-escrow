import { Blockfrost, Lucid } from "@spacebudz/lucid";
import { env } from "../../config.ts";
import { deployScript } from "../builders/deploy-script.ts";

const lucid = new Lucid({
  provider: new Blockfrost(env.PROVIDER_URL, env.PROVIDER_PROJECT_ID),
});
lucid.selectWalletFromSeed(process.env.SEED as string);
const txId = await deployScript(lucid);
console.log(`Validator deployed. TxId: ${txId}`);
