use aiken/cbor.{serialise}
use aiken/collection/list
use aiken/interval.{is_entirely_before}
use aiken/primitive/bytearray.{compare, concat}
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, flatten, quantity_of}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use config
use types.{Action, Datum}

validator channel {
  mint(_redeemer: Data, policy_id: PolicyId, self: Transaction) {
    let Transaction { inputs, mint, outputs, validity_range, .. } = self
    expect [(_, minted_name, minted_quantity)] = mint |> flatten

    if minted_quantity > 0 {
      let one_token_minted = minted_quantity == 1
      expect [channel_output, ..] = outputs
      expect Output {
        address: Address {
          payment_credential: Script(script_hash),
          stake_credential: None,
        },
        value: val,
        datum: InlineDatum(dat),
        reference_script: None,
      } = channel_output

      // Check output has self script address
      let has_script_addr = script_hash == policy_id

      // Has only Lovelace, the minted control token, and an amount > 0 of AGIX
      let channel_utxo_has_correct_value = and {
          (list.length(flatten(val)) == 3)?,
          (quantity_of(val, policy_id, minted_name) == 1)?,
          (quantity_of(val, config.agix_policy, config.agix_hexa) > 0)?,
        }

      let length_of_name = bytearray.length(minted_name) == 28

      expect [first_input, ..] = inputs
      let Input {
        output_reference: OutputReference { transaction_id, output_index },
        output: _,
      } = first_input

      expect Datum {
        channel_id,
        nonce: 0,
        signer,
        receiver,
        group_id,
        expiration_date,
      } = dat

      let channel_id_is_correct =
        compare(channel_id, concat(transaction_id, serialise(output_index))) == Equal

      let expiration_date_is_correct =
        is_entirely_before(validity_range, expiration_date)

      let length_of_receiver = bytearray.length(receiver) == 28

      let length_of_signer = bytearray.length(signer) == 32

      let group_id_is_bytearray = bytearray.length(group_id) > 0

      and {
        one_token_minted?,
        has_script_addr?,
        length_of_name?,
        channel_utxo_has_correct_value?,
        channel_id_is_correct?,
        expiration_date_is_correct?,
        length_of_receiver?,
        length_of_signer?,
        group_id_is_bytearray?,
      }
    } else {
      True
    }
  }

  spend(
    datum: Option<Datum>,
    redeemer: Action,
    utxo: OutputReference,
    self: Transaction,
  ) {
    True
  }

  else(_) {
    fail
  }
}
