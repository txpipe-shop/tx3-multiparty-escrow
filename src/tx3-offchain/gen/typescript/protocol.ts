// This file is auto-generated.

import {
  Client as TRPClient,
  type ClientOptions,
  type TxEnvelope,
} from "tx3-sdk/trp";

export const DEFAULT_TRP_ENDPOINT = "http://localhost:3000/trp";

export const DEFAULT_HEADERS = {};

export const DEFAULT_ENV_ARGS = {};

export type OpenParams = {
  channelid: Uint8Array;
  collateralref: string;
  date: number;
  groupid: Uint8Array;
  initialdeposit: number;
  inputref: string;
  policyid: Uint8Array;
  receiverinput: Uint8Array;
  sender: string;
  signerpubkey: Uint8Array;
  since: number;
  tokenname: Uint8Array;
  until: number;
  validatorref: string;
};

export const OPEN_IR = {
  bytecode:
    "12010d0c76616c696461746f72726566060106736f7572636501010d0673656e6465720500010d08696e707574726566060000000201091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f8133010300060d096368616e6e656c69640405000d0c7369676e65727075626b6579040d0d7265636569766572696e707574040d0767726f75706964040d0464617465020111110c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0e696e697469616c6465706f736974020c01000005fc80969800000c010d08706f6c6963796964040d09746f6b656e6e616d6504050200010d0673656e6465720500011111111006736f757263650c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0e696e697469616c6465706f736974020112010c01000005fc809698000101010d0573696e636502010d05756e74696c0201010c010d08706f6c6963796964040d09746f6b656e6e616d650405020103000000010000010d0d636f6c6c61746572616c726566060000",
  encoding: "hex",
  version: "v1alpha5",
};

export type CloseParams = {
  channelutxo: string;
  collateralref: string;
  policyid: Uint8Array;
  scriptScript: string;
  sender: string;
  since: number;
  tokenname: Uint8Array;
  until: number;
  validatorref: string;
};

export const CLOSE_IR = {
  bytecode:
    "12010d0c76616c696461746f727265660601067461726765740101091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f813300010d0b6368616e6e656c7574786f0600010302000106536372697074091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f81330001010d0673656e6465720500011111100674617267657412010c010d08706f6c6963796964040d09746f6b656e6e616d650405020101010d0573696e636502010d05756e74696c0201010c010d08706f6c6963796964040d09746f6b656e6e616d650405010103000000010000010d0d636f6c6c61746572616c7265660601010d0673656e6465720500",
  encoding: "hex",
  version: "v1alpha5",
};

export type UpdateParams = {
  adddeposit: number;
  channelutxo: string;
  collateralref: string;
  extenddate: number;
  inputref: string;
  scriptScript: string;
  signer: Uint8Array;
  since: number;
  until: number;
  user: string;
  validatorref: string;
};

export const UPDATE_IR = {
  bytecode:
    "12010d0c76616c696461746f7272656606020763757272656e740101091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f813300010d0b6368616e6e656c7574786f0600010300000106536372697074091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f81330006736f7572636501010d04757365720500010d08696e707574726566060000000201091c7da6163888081e317f8567176057f0e9634932f85bc630657b1f813301030006042190ec6e857d6f02b38cd902361963f68ea6cceab563e14dd29a2661b7b25912b501050004200a0b0bddc14de4b88bd3e9cc7d29886ce1bb637b81dbcc3a87d6992822dd1eab041c5fd3815155ca7cdac6b64d66ab39886593da2e56c47147e69ad0a9e4040667726f7570310d0a657874656e6464617465020111100763757272656e740c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0a6164646465706f7369740200010d047573657205000111111006736f757263650c01041c921e27e15e2552a40515564ba10a26ecb1fe1a34ac6ccb58c1ce13200404414749580d0a6164646465706f7369740201120101010d0573696e636502010d05756e74696c020000010000010d0d636f6c6c61746572616c7265660601010d067369676e65720400",
  encoding: "hex",
  version: "v1alpha5",
};

export class Client {
  readonly #client: TRPClient;

  constructor(options: ClientOptions) {
    this.#client = new TRPClient(options);
  }

  async openTx(args: OpenParams): Promise<TxEnvelope> {
    return await this.#client.resolve({
      tir: OPEN_IR,
      args,
    });
  }
  async closeTx(args: CloseParams): Promise<TxEnvelope> {
    return await this.#client.resolve({
      tir: CLOSE_IR,
      args,
    });
  }
  async updateTx(args: UpdateParams): Promise<TxEnvelope> {
    return await this.#client.resolve({
      tir: UPDATE_IR,
      args,
    });
  }
}

// Create a default client instance
export const protocol = new Client({
  endpoint: DEFAULT_TRP_ENDPOINT,
  headers: DEFAULT_HEADERS,
  envArgs: DEFAULT_ENV_ARGS,
});
