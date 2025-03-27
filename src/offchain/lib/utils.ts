import { Blockfrost, Lucid } from "@spacebudz/lucid";
import { env } from "../../config.ts";

export const lucid = new Lucid({
    provider: new Blockfrost(
        env.PROVIDER_URL,
      env.PROVIDER_PROJECT_ID,
    ),
    network: env.NETWORK as "Mainnet" | "Preprod"
  });