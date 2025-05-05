use aiken/cbor.{serialise}
use aiken/collection/dict.{to_pairs}
use aiken/crypto.{verify_ed25519_signature}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{Value, add, match, quantity_of, tokens}
use cardano/transaction.{Datum, InlineDatum, Input, Output}
use config
use types.{Action, Claim, Datum as ChannelDatum}

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
          address: in_address,
          value: in_value,
          datum: InlineDatum(data),
          reference_script: None,
        },
        ..
      } = input
      expect Address {
        payment_credential: Script(own_hash),
        stake_credential: None,
      } = in_address
      expect in_datum: ChannelDatum = data

      expect Output {
        address: out_address,
        datum: out_datum,
        value: out_value,
        reference_script: None,
      } = output

      expect action: Action = redeemer
      expect Claim { amount, signature, finalize } = action
      let payload =
        serialise(
          [serialise(in_datum.nonce), in_datum.channel_id, serialise(amount)],
        )
      let check_signature =
        verify_ed25519_signature(in_datum.signer, payload, signature)

      // Find channel token (token name is the sender's public key hash)
      expect [Pair(sender_pkh, 1)] = tokens(in_value, own_hash) |> to_pairs()

      // Check over this input and output
      let check_output =
        if finalize {
          // Channel is closed, pay remaining funds to the sender
          let check_address =
            out_address.payment_credential == VerificationKey(sender_pkh)

          let check_value = {
            let expected_out_val =
              in_value
                |> add(own_hash, sender_pkh, -1)
                |> add(config.agix_policy, config.agix_hexa, -amount)
            match(out_value, expected_out_val, >=)
          }

          let check_mint = ( mint |> quantity_of(own_hash, sender_pkh) ) == -1

          and {
            check_address?,
            check_value?,
            check_mint?,
          }
        } else {
          // Channel is still open, check continuing output
          let check_address = out_address == in_address

          let check_value = {
            let expected_value =
              in_value
                |> add(config.agix_policy, config.agix_hexa, -amount)
            match(out_value, expected_value, >=)
          }

          let check_datum = {
            expect InlineDatum(d) = out_datum
            expect out_channel_datum: ChannelDatum = d
            out_channel_datum == ChannelDatum {
              ..in_datum,
              nonce: in_datum.nonce + 1,
            }
          }

          and {
            check_address?,
            check_value?,
            check_datum?,
          }
        }

      and {
        check_output?,
        check_signature?,
        // Check over remaining inputs and outputs
        check_claims(remaining_inputs, remaining_outputs, mint),
      }
    }
    _ -> False
  }
}
