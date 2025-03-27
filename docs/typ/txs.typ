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