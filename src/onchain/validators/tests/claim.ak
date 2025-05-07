use cardano/address.{Script}
use cardano/assets.{add, zero} as value
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, Spend, Withdraw, placeholder,
}
use config
use mocktail.{add_extra_signatory, add_input, add_mint, add_output, add_redeemer}
use singularity
use tests/mocks
use types.{Claim, Datum}

// ==============================================================================================
// Claim Tests
// ==============================================================================================
type ClaimOptions {
  // Validations on Spend validator
  edit_signatories: Bool,
  no_withdraw_redeemer: Bool,
  // Validations on Withdraw validator - finalize channel
  wrong_sender_output_address: Bool,
  wrong_sender_output_value: Bool,
  edit_minting: Bool,
  wrong_signature: Bool,
  // Validations on Withdraw validator - continue channel
  wrong_channel_output_address: Bool,
  wrong_channel_output_value: Bool,
  wrong_channel_output_datum: Bool,
}

fn default_claim_options() -> ClaimOptions {
  ClaimOptions {
    edit_signatories: False,
    no_withdraw_redeemer: False,
    wrong_sender_output_address: False,
    wrong_sender_output_value: False,
    edit_minting: False,
    wrong_signature: False,
    wrong_channel_output_address: False,
    wrong_channel_output_value: False,
    wrong_channel_output_datum: False,
  }
}

// Mock tx which spends two channels: runs the withdraw validator and a spend validator for each.
fn claim(options: ClaimOptions) {
  let channel1_datum =
    Datum {
      channel_id: mocks.channel_id_1,
      nonce: 0,
      signer: mocks.signer_1,
      receiver: mocks.receiver_1,
      group_id: mocks.group_id,
      expiration_date: 10,
    }
  let channel2_datum =
    Datum {
      channel_id: mocks.channel_id_2,
      nonce: 0,
      signer: mocks.signer_1,
      receiver: mocks.receiver_1,
      group_id: mocks.group_id,
      expiration_date: 10,
    }

  // Inputs
  let channel_value_1_base =
    zero
      |> add(mocks.own_hash, mocks.sender_1, 1)
      |> add(config.agix_policy, config.agix_hexa, 1000)
  let channel_input_1 =
    Input {
      output: Output {
        address: mocks.own_address,
        value: channel_value_1_base,
        datum: InlineDatum(channel1_datum),
        reference_script: None,
      },
      output_reference: mocks.channel_1_out_ref,
    }

  let channel_value_2_base =
    zero
      |> add(mocks.own_hash, mocks.sender_2, 1)
      |> add(config.agix_policy, config.agix_hexa, 1000)
  let channel_input_2 =
    Input {
      output: Output {
        address: mocks.own_address,
        value: channel_value_2_base,
        datum: InlineDatum(channel2_datum),
        reference_script: None,
      },
      output_reference: mocks.channel_2_out_ref,
    }

  // Outputs
  let channel_output_1 =
    Output {
      address: mocks.own_address,
      value: channel_value_1_base
        |> add(config.agix_policy, config.agix_hexa, -20),
      datum: InlineDatum(Datum {..channel1_datum, nonce: channel1_datum.nonce + 1}),
      reference_script: None,
    }
  let channel_output_2 =
    Output {
      address: mocks.sender_2_address,
      value: channel_value_2_base
        |> add(config.agix_policy, config.agix_hexa, -20)
        |> add(mocks.own_hash, mocks.sender_2, -1),
      datum: NoDatum,
      reference_script: None,
    }

  // Minting and redeemers
  let mint = zero |> add(mocks.own_hash, mocks.sender_2, -1)
  let redeemer_1: Data =
    Claim { amount: 20, signature: mocks.signature_1, finalize: False }
  let redeemer_2: Data =
    Claim { amount: 20, signature: mocks.signature_2, finalize: True }
  let withdraw_redeemer: Data = Void

  let tx =
    placeholder
      |> add_input(True, channel_input_1)
      |> add_input(True, channel_input_2)
      |> add_output(True, channel_output_1)
      |> add_output(True, channel_output_2)
      |> add_mint(True, mint)
      |> add_redeemer(True, Pair(Spend(mocks.channel_1_out_ref), redeemer_1))
      |> add_redeemer(True, Pair(Spend(mocks.channel_2_out_ref), redeemer_2))
      |> add_redeemer(
          !options.no_withdraw_redeemer,
          Pair(Withdraw(Script(mocks.own_hash)), withdraw_redeemer),
        )
      |> add_extra_signatory(!options.edit_signatories, mocks.receiver_1)

  and {
    singularity.channel.spend(
      Some(channel1_datum),
      Claim { amount: 20, signature: mocks.signature_1, finalize: False },
      mocks.channel_1_out_ref,
      tx,
    ),
    singularity.channel.spend(
      Some(channel2_datum),
      Claim { amount: 20, signature: mocks.signature_2, finalize: True },
      mocks.channel_2_out_ref,
      tx,
    ),
    singularity.channel.withdraw(Void, Script(mocks.own_hash), tx),
  }
}

test claim_ok() {
  let options = default_claim_options()
  claim(options)
}

test not_signed_by_receiver() fail {
  let options = ClaimOptions {..default_claim_options(), edit_signatories: True}
  claim(options)
}

test no_withdraw_redeemer() fail {
  let options = ClaimOptions {..default_claim_options(), no_withdraw_redeemer: True}
  claim(options)
}