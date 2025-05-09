use aiken/collection/dict.{to_pairs}
use aiken/collection/list.{any, filter, length, map, take}
use aiken/collection/pairs.{get_first}
use aiken/interval.{is_entirely_before}
use aiken/option.{is_some}
use aiken/primitive/bytearray.{compare, compare, concat}
use aiken/primitive/int
use cardano/address.{Address, Credential, Script}
use cardano/assets.{
  PolicyId, flatten, merge, negate, quantity_of, restricted_to, tokens, zero,
}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Spend, Transaction, Withdraw,
  find_input,
}
use checks.{check_claims}
use config
use types.{Action, Claim, Close, Datum, Update}

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
    let Transaction {
      mint,
      redeemers,
      outputs,
      validity_range,
      extra_signatories,
      inputs,
      ..
    } = self
    expect Some(Input {
      output: Output {
        address: Address { payment_credential: script_hash, .. },
        ..
      },
      ..
    }) = find_input(inputs, utxo)
    expect Some(Datum { receiver, .. }) = datum

    when redeemer is {
      Claim { .. } -> {
        let signed_by_receiver =
          any(extra_signatories, fn(signatory) { signatory == receiver })
        // The withdraw purpose of the script is being run
        let withdraw_running =
          get_first(redeemers, Withdraw(script_hash)) |> is_some()
        and {
          withdraw_running?,
          signed_by_receiver?,
        }
      }

      Update -> {
        expect Some(Datum {
          channel_id,
          nonce,
          signer,
          receiver,
          group_id,
          expiration_date,
        }) = datum

        let channel_is_still_valid =
          is_entirely_before(validity_range, expiration_date)

        // Enforce channel to be the first output
        expect [channel_output, ..] = outputs

        expect Output {
          address: o_address,
          value: o_val,
          datum: InlineDatum(o_datum),
          reference_script: None,
        } = channel_output

        expect Address {
          payment_credential: Script(script_hash),
          stake_credential: None,
        } = o_address

        // No tokens with this policy are minted nor burned
        let no_tokens_minted_or_burned =
          restricted_to(mint, [script_hash]) == zero

        // Only one script input of self address
        expect [script_input] =
          filter(inputs, fn(i) { i.output.address == o_address })

        expect Input {
          output: Output {
            address: i_address,
            value: i_value,
            reference_script: None,
            ..
          },
          ..
        } = script_input

        expect Datum {
          channel_id: o_channel_id,
          nonce: o_nonce,
          signer: o_signer,
          receiver: o_receiver,
          group_id: o_group_id,
          expiration_date: o_expiration_date,
        } = o_datum

        expect [Pair(sender_pk, 1)] = o_val |> tokens(script_hash) |> to_pairs
        // Sender signing the tx IF the expiration date is updated
        let correct_signer =
          if o_expiration_date != expiration_date {
            list.has(extra_signatories, sender_pk)?
          } else {
            True
          }

        // Output preserves script address
        let has_script_addr = o_address == i_address

        // AGIX amount on output value >= AGIX amount on input value && remaining values are unchanged
        let o_vals_are_correct =
          (quantity_of(i_value, config.agix_policy, config.agix_hexa) <= quantity_of(
            o_val,
            config.agix_policy,
            config.agix_hexa,
          ))? && ((
            i_value
              |> negate
              |> merge(o_val)
              |> restricted_to(["", script_hash])
          ) == zero)?

        let channel_is_valid =
          is_entirely_before(validity_range, o_expiration_date)

        let rest_of_datum_is_unchanged = and {
            (compare(o_channel_id, channel_id) == Equal)?,
            (int.compare(o_nonce, nonce) == Equal)?,
            (compare(o_signer, signer) == Equal)?,
            (compare(o_receiver, receiver) == Equal)?,
            (compare(o_group_id, group_id) == Equal)?,
          }

        and {
          no_tokens_minted_or_burned?,
          channel_is_still_valid?,
          correct_signer?,
          has_script_addr?,
          o_vals_are_correct?,
          channel_is_valid?,
          rest_of_datum_is_unchanged?,
        }
      }

      _ -> True
    }
  }

  withdraw(_redeemer: Data, account: Credential, self: Transaction) {
    let Transaction { inputs, outputs, redeemers, mint, .. } = self
    let own_address =
      Address { payment_credential: account, stake_credential: None }
    let own_inputs = filter(inputs, fn(i) { i.output.address == own_address })
    let payment_outputs = outputs |> take(length(own_inputs))
    let resolved_inputs_with_redeemers =
      map(
        own_inputs,
        fn(i) {
          expect Some(red) = get_first(redeemers, Spend(i.output_reference))
          (i.output, red)
        },
      )
    expect Script(own_policy) = account
    let own_policy_mints = restricted_to(mint, [own_policy])

    check_claims(
      resolved_inputs_with_redeemers,
      payment_outputs,
      own_policy_mints,
    )
  }

  else(_) {
    fail
  }
}
