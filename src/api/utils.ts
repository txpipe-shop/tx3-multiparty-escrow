import { Addresses, Network } from "@spacebudz/lucid";
import z, { ZodError } from "zod";
import { env } from "../config.ts";

const NETWORKS = {
  MAINNET: {
    url: "https://cardano-mainnet.blockfrost.io/api/v0",
    network: "Mainnet",
  },
  PREPROD: {
    url: "https://cardano-preprod.blockfrost.io/api/v0",
    network: "Preprod",
  },
  PREVIEW: {
    url: "https://cardano-preview.blockfrost.io/api/v0",
    network: "Preview",
  },
} as const;


/**
 * Gets the right url & network for the API
 *
 * @param projectId ProjectId of the Blockfrost API
 * @returns A pair {url, network} according to the `projectId`
 */
function deduceBlockfrostUrlAndNetwork(projectId: string): {
  url: string;
  network: Network;
} {
  if (projectId.includes(NETWORKS.MAINNET.network.toLowerCase())) {
    return NETWORKS.MAINNET;
  }
  if (projectId.includes(NETWORKS.PREVIEW.network.toLowerCase())) {
    return NETWORKS.PREVIEW;
  }
  if (projectId.includes(NETWORKS.PREPROD.network.toLowerCase())) {
    return NETWORKS.PREPROD;
  }
  throw new Error("Invalid projectId");
}

const { network } = deduceBlockfrostUrlAndNetwork(env.PROVIDER_PROJECT_ID);