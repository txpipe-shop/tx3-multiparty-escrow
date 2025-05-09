use aiken/cbor.{serialise}
use aiken/collection/dict.{to_pairs}
use aiken/crypto.{verify_ed25519_signature}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{Value, add, match, quantity_of, tokens, zero}
use cardano/transaction.{Datum, InlineDatum, Output}
use config
use types.{Claim, Datum as ChannelDatum}


pub fn check_claims(
  inputs_with_redeemers: List<(Output, Data)>,
  outputs: List<Output>,
  mint: Value,
) -> Bool {
  when (inputs_with_redeemers, outputs) is {
    // There should be no channel tokens left in the mint value after all the inputs
    // have been checked.
    ([], []) -> mint == zero
    ([(input, redeemer), ..remaining_inputs], [output, ..remaining_outputs]) -> {
      // Destructure input, output and redeemer
      expect Output {
        address: in_address,
        value: in_value,
        datum: InlineDatum(data),
        reference_script: None,
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

      expect Claim { amount, signature, finalize } = redeemer
      let payload = serialise((in_datum.nonce, in_datum.channel_id, amount))

      // Find channel token (token name is the sender's public key hash)
      expect [Pair(sender_pkh, 1)] = tokens(in_value, own_hash) |> to_pairs()

      // Check over this input and output
      let check_output =
        if finalize {
          // Channel is closed, pay remaining funds to the sender
          let expected_out_val =
            in_value
              |> add(own_hash, sender_pkh, -1)
              |> add(config.agix_policy, config.agix_hexa, -amount)

          and {
            // Output address is the sender's address
            (out_address.payment_credential == VerificationKey(sender_pkh))?,
            // Output value equals the input value minus the AGIX amount and the channel token
            match(out_value, expected_out_val, >=)?,
            // The channel token is burned.
            // There could be more than one channels of this sender being closed, so we add
            // one to the mint value before checking the next input.
            (( mint |> quantity_of(own_hash, sender_pkh) ) <= -1)?,
          }
        } else {
          // Channel is still open, check continuing output

          let expected_value =
            in_value
              |> add(config.agix_policy, config.agix_hexa, -amount)
          expect InlineDatum(d) = out_datum
          expect out_channel_datum: ChannelDatum = d

          and {
            // Output preserves address
            (out_address == in_address)?,
            // Output value only reduces by the AGIX amount
            match(out_value, expected_value, >=)?,
            // Nonce is incremented by 1, and the rest of the datum remains unchanged
            (out_channel_datum == ChannelDatum {
              ..in_datum,
              nonce: in_datum.nonce + 1,
            })?,
          }
        }

      // Add the channel token to the remaining mint if it was burned
      let remaining_mint =
        if finalize {
          mint |> add(own_hash, sender_pkh, 1)
        } else {
          mint
        }

      and {
        check_output?,
        // Check the signature provided by redeemer allows for claiming "amount" on this channel with "channelId"
        // only once, ensured by the "nonce"
        verify_ed25519_signature(in_datum.signer, payload, signature)?,
        // Check over remaining inputs and outputs
        check_claims(remaining_inputs, remaining_outputs, remaining_mint),
      }
    }
    _ -> False
  }
}
