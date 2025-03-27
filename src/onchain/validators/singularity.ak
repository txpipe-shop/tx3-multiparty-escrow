use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}
use types.{Action, Datum}

validator channel {
  mint(redeemer: Data, policy_id: PolicyId, self: Transaction) {
    // todo @"mint logic goes here"
    True
  }

  spend(
    datum: Option<Datum>,
    redeemer: Action,
    utxo: OutputReference,
    self: Transaction,
  ) {
    // todo @"spend logic goes here"
    True
  }

  else(_) {
    fail
  }
}
