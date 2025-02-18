use cardano/address.{Credential}
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction, OutputReference}

validator multiparty_escrow {
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    todo @"mint logic goes here"
  }

  spend(_datum: Option<Data>, _redeemer: Data, _utxo: OutputReference, _self: Transaction) {
    todo @"spend logic goes here"
  }

  withdraw(_redeemer: Data, _account: Credential, _self: Transaction) {
    todo @"withdraw logic goes here"
  }

  else(_) {
    fail
  }
}
