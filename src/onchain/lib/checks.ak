use aiken/collection/dict.{to_pairs}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{Value, add, quantity_of, tokens}
use cardano/transaction.{InlineDatum, Input, Output}
use config
use types.{Action, Claim, Close, Datum}

pub fn check_claims(
  inputs_with_redeemers: List<(Input, Data)>,
  outputs: List<Output>,
  mint: Value,
) -> Bool {
  when (inputs_with_redeemers, outputs) is {
    ([], []) -> True
    ([(input, redeemer), ..remaining_inputs], [output, ..remaining_outputs]) -> {
      // Destructure input, output and redeemer
      expect Input {
        output: Output {
          address: Address {
            payment_credential: Script(own_hash),
            stake_credential: None,
          },
          value: in_value,
          datum: InlineDatum(data),
          reference_script: None,
        },
        ..
      } = input
      expect in_datum: Datum = data

      expect Output {
        address: out_address,
        datum: out_datum,
        value: out_value,
        reference_script: None,
      } = output
      expect action: Action = redeemer

      // Find channel token (token name is the sender's public key hash)
      expect [Pair(sender_pkh, 1)] = tokens(in_value, own_hash) |> to_pairs()

      // Check over this input and output
      let single_check =
        when action is {
          Close -> {
            let check_address =
              out_address.payment_credential == VerificationKey(sender_pkh)
            let check_value = {
              let expected_out_val =
                in_value
                  |> add(own_hash, sender_pkh, -1)
                  |> add(config.agix_policy, config.agix_hexa, 1)
              out_value == expected_out_val
            }
            let check_mint = (mint |> quantity_of(own_hash, sender_pkh)) == -1
            and {
              check_address?,
              check_value?,
              check_mint?,
            }
          }
          Claim { .. } -> True
          _ -> fail @"Invalid redeemer"
        }

      // Check over remaining inputs and outputs
      and {
        single_check?,
        check_claims(remaining_inputs, remaining_outputs, mint),
      }
    }
    _ -> False
  }
}
