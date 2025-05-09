use aiken/cbor.{serialise}
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray.{concat}
use cardano/address.{Address, PaymentCredential, Script}
use cardano/assets.{Value, ada_asset_name, ada_policy_id, add, from_asset}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, placeholder,
}
use cocktail.{address_pub_key}
use config
use mocktail.{
  add_extra_signatory, add_input, add_mint, add_output, mock_interval,
  mock_policy_id, mock_pub_key_address, mock_script_credential,
  set_transaction_id,
}
use mocktail/virgin_output_reference.{mock_tx_hash}
use singularity
use types.{Datum, Update}

const script_hash = mock_policy_id(0)

const sender_addr = mock_pub_key_address(0, None)

const channel_token = {
    expect Some(pub_key_hash) = address_pub_key(sender_addr)
    from_asset(script_hash, pub_key_hash, 1)
  }

const default_value =
  channel_token
    |> add(ada_policy_id, ada_asset_name, 4_000_000)
    |> add(config.agix_policy, config.agix_hexa, 1_000_000)

const receiver_addr = mock_pub_key_address(1, None)

const transaction_id_1 = mock_tx_hash(0)

const transaction_id_2 = mock_tx_hash(1)

const transaction_id_3 = mock_tx_hash(2)

// ==============================================================================================
// Update Tests
// ==============================================================================================
type UpdateOptions {
  expiration_date: Int,
  channel_is_first_output: Bool,
  only_one_script_input: Bool,
  no_minting_or_burning: Bool,
  tx_signer: VerificationKeyHash,
  output_value: Value,
  change_datum: Bool,
  script_address: PaymentCredential,
}

fn get_default_update_options() -> UpdateOptions {
  expect Some(pub_key_hash) = address_pub_key(sender_addr)

  UpdateOptions {
    expiration_date: 110,
    channel_is_first_output: True,
    only_one_script_input: True,
    no_minting_or_burning: True,
    tx_signer: pub_key_hash,
    output_value: default_value,
    change_datum: False,
    script_address: Script(script_hash),
  }
}

fn update(options: UpdateOptions) -> Bool {
  expect Some(pub_key_hash) = address_pub_key(receiver_addr)
  let input_datum =
    Datum {
      channel_id: concat(transaction_id_1, serialise(0)),
      nonce: 0,
      signer: #"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      receiver: pub_key_hash,
      group_id: "group1",
      expiration_date: 100,
    }

  let input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: transaction_id_1,
        output_index: 0,
      },
      output: Output {
        address: Address {
          payment_credential: Script(script_hash),
          stake_credential: None,
        },
        value: default_value,
        datum: InlineDatum(input_datum),
        reference_script: None,
      },
    }

  let update_datum =
    Datum {
      channel_id: concat(transaction_id_1, serialise(0)),
      nonce: 0,
      signer: #"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      receiver: pub_key_hash,
      group_id: when options.change_datum is {
        True -> "group2"
        False -> "group1"
      },
      expiration_date: options.expiration_date,
    }

  let output_utxo =
    Output {
      address: Address {
        payment_credential: options.script_address,
        stake_credential: None,
      },
      value: options.output_value,
      datum: InlineDatum(update_datum),
      reference_script: None,
    }

  let tx =
    placeholder
      |> add_input(
          !options.only_one_script_input,
          Input {
            output_reference: OutputReference {
              transaction_id: transaction_id_3,
              output_index: 0,
            },
            output: Output {
              address: Address {
                payment_credential: Script(script_hash),
                stake_credential: None,
              },
              value: default_value,
              datum: InlineDatum(input_datum),
              reference_script: None,
            },
          },
        )
      |> add_input(True, input_utxo)
      |> add_output(
          !options.channel_is_first_output,
          Output {
            address: sender_addr,
            value: from_asset(ada_policy_id, ada_asset_name, 10_000_000),
            datum: NoDatum,
            reference_script: None,
          },
        )
      |> add_mint(
          !options.no_minting_or_burning,
          from_asset(script_hash, pub_key_hash, -1),
        )
      |> add_output(True, output_utxo)
      |> add_extra_signatory(True, options.tx_signer)
      |> set_transaction_id(True, transaction_id_2)

  let result =
    singularity.channel.spend(
      OutputReference { transaction_id: transaction_id_2, output_index: 0 },
      datum: Some(input_datum),
      redeemer: Update,
      self: Transaction {
        ..tx,
        validity_range: mock_interval(Some(0), Some(90)),
      },
    )
  result
}

test update_ok() {
  update(get_default_update_options())
}

test expiration_date_to_before() fail {
  update(UpdateOptions { ..get_default_update_options(), expiration_date: 10 })
}

test channel_is_not_first_output() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      channel_is_first_output: False,
    },
  )
}

test more_than_one_script_input() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      only_one_script_input: False,
    },
  )
}

test no_tokens_minted_or_burned() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      no_minting_or_burning: False,
    },
  )
}

test tx_signer_is_not_the_sender_when_updating_expiration_date() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      tx_signer: #"baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
  )
}

test agix_amount_decreased() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      output_value: default_value
        |> add(config.agix_policy, config.agix_hexa, -1_000),
    },
  )
}

test lovelace_amount_decreased() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      output_value: default_value
        |> add(ada_policy_id, ada_asset_name, -1),
    },
  )
}

test script_address_is_not_the_same() fail {
  update(
    UpdateOptions {
      ..get_default_update_options(),
      script_address: mock_script_credential(1),
    },
  )
}
