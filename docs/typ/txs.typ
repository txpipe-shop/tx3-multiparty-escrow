#import "./report.typ": *

#let tx_open_channel = [
  #vanilla_transaction("Open Channel",
  inputs: (
    (
      name: "Sender UTxO",
      value: (
        AGIX: "M"
      ),
    ),
  ),
  outputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "K"
      ),
      datum: (
        ChannelDatum : (
          "Nonce": `0`,
          "ChannelId":"Sender UTxO",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration":"",
          ),
      ),
    ),
    (
      name: "Sender UTxO",
      value: (
        AGIX: "M - K"
      ),
    ),
  ),
  mint: (
    "channel_token": (qty: 0, variables: (("1":1))),
  ),
  signatures: ((`sender`), ),
  notes: [
    #v(0.1pt)
    `channel_token` $=$ "channel script" + "channel id"
    #v(0.1pt)
    Sender opens a channel with `K` AGIX
  ]
)
]

= Open Channel
#tx_open_channel
#v(2cm)

#let tx_update_channel = [
  #vanilla_transaction("Update Channel",
  inputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M"
      ),
      datum: (
        ChannelDatum : (
          "Nonce":"",
          "ChannelId":"",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration":"",
          ),
      ),
      redeemer: "Update",
    ),
  ),
  outputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M + K"
      ),
      datum: (
ChannelDatum : (
          "Nonce":"",
          "ChannelId":"",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration'":"",
          ),
      ),
    ),
  ),
  mint: (
  ),
  signatures: ((`user`), ),
  notes: [
    #v(0.1pt)
    #v(0.1pt)
    `Expiration` $<=$ `Expiration'`
    #v(0.1pt)
    0 $<=$ K
    #v(0.1pt)
    user must be sender when extending the channel
  ]
)
]

#pagebreak()
= Extend and/or AddFunds Channel
#tx_update_channel
#v(2cm)

#let tx_claim_channel = [
  #vanilla_transaction("Claim Channel",
  inputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M"
      ),
      datum: (
        ChannelDatum : (
          "Nonce": "",
          "ChannelId":"",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration":"",
        ),
      ),
      redeemer: "Claim(msg)",
    ),
  ),
  outputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M - K"
      ),
      datum: (
        ChannelDatum : (
          "Nonce'": "",
          "ChannelId":"",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration":"",
        ),
      ),
    ),
    (
      name: "Receiver UTxO",
      value: (
        AGIX: "K"
      ),
    ),
  ),
  mint: (
  ),
  signatures: ((`receiver`), ),
  notes: [
    #v(0.1pt)
    `msg` is signed by the signer
    #v(0.1pt)
    `Nonce'` $=$ `Nonce` + 1
  ]
)
]

#pagebreak()
= Claim Channel
#tx_claim_channel
#v(2cm)

#let tx_multiclaim_channel = [
  #vanilla_transaction("Claim Channel",
  inputs: (
    (
      name: "Channel UTxO (Sender1)",
      address: "channel script + _",
      value: (
        "channel_token_1": "1",
        AGIX: "M"
      ),
      datum: (
        ChannelDatum : (
          "Nonce_1": "",
          "ChannelId_1":"",
          "Signer_1":"",
          "Receiver_1":"",
          "GroupId_1":"",
          "Expiration_1":"",
        ),
      ),
      redeemer: "Claim(msg)",
    ),
    (
      name: "Channel UTxO (Sender2)",
      address: "channel script + _",
      value: (
        "channel_token_2": "1",
        AGIX: "N"
      ),
      datum: (
        ChannelDatum : (
          "Nonce_2": "",
          "ChannelId_2":"",
          "Signer_2":"",
          "Receiver_2":"",
          "GroupId_2":"",
          "Expiration_2":"",
        ),
      ),
      redeemer: "Claim(msg_2)",
    )
  ),
  outputs: (
    (
      name: "Channel UTxO (Sender1)",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M - K1"
      ),
      datum: (
        ChannelDatum : (
          "Nonce_1'": "",
          "ChannelId_1":"",
          "Signer_1":"",
          "Receiver_1":"",
          "GroupId_1":"",
          "Expiration_1":"",
        ),
      ),
    ),
    (
      name: "Sender2 UTxO",
      address: "sender2 address + _",
      value: (
        AGIX: "N - K2"
      ),
    ),
    (
      name: "Receiver UTxO",
      value: (
        AGIX: "K1 + K2"
      ),
    ),
  ),
  mint: (
    "channel_token_2": (qty: 0, variables: (("1":-1))),
  ),
  signatures: ((`receiver`), ),
  notes: [
    #v(0.1pt)
    `msg` is signed by the signer_1
    #v(0.1pt)
    `msg_2` is signed by the signer_2
    #v(0.1pt)
    `Nonce_1'` $=$ `Nonce_1` + 1
  ]
)
]

#pagebreak()
= Claim Multiple Channels
#tx_multiclaim_channel
#v(2cm)


#let tx_close_channel = [
  #vanilla_transaction("Claim Channel",
  inputs: (
    (
      name: "Channel UTxO",
      address: "channel script + _",
      value: (
        "channel_token": "1",
        AGIX: "M"
      ),
      datum: (
        ChannelDatum : (
          "Nonce": "",
          "ChannelId":"",
          "Signer":"",
          "Receiver":"",
          "GroupId":"",
          "Expiration":"",
        ),
      ),
      redeemer: "Close",
    ),
  ),
  outputs: (
    (
      name: "Sender UTxO",
      value: (
        AGIX: "M"
      ),
    ),
  ),
  mint: (
    "channel_token": (qty: 0, variables: (("1":-1))),
  ),
  validRange: (lower: `Expiration`),
  signatures: ((`sender`), ),
  notes: [
  ]
)
]

#pagebreak()
= Close Channel
#tx_close_channel
#v(2cm)