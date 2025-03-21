use aiken/crypto.{VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

pub type Datum {
  channel_id: ByteArray,
  nonce: Int,
  signer: ByteArray,
  receiver: VerificationKey,
  group_id: Int,
  expiration_date: Int,
}

pub type Action {
  Update
  Claim
  Close
}

validator mpe {
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    // todo @"mint logic goes here"
    True
  }

  spend(
    datum: Option<Datum>,
    redeemer: Action,
    _utxo: OutputReference,
    _self: Transaction,
  ) {
    // todo @"spend logic goes here"
    True
  }

  else(_) {
    fail
  }
}
