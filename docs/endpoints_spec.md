# Contract Endpoints

## Open Channel

**url:** /open
PARAMETERS:

> 1. senderAddress: `string`
> 2. signerAddress: `string`
> 3. receiverAddress: `string`
> 4. initialDeposit: `bigint`
> 5. expirationDate: `bigint`
> 6. groupId: `string`

RESPONSE:
> tx: `openChannelTx`

## Update Channel
**url:** /update
PARAMETERS:

> 1. txOutRef: `OutRef`
> 2. addDeposit?: `bigint`
> 3. expirationDate?: `bigint`

Where
> OutRef:
>> 1. txHash: `string`
>> 2. outputIndex: `number`


RESPONSE:
> tx: `updatedChannelTx`

## Claim Channel
**url:** /claim
PARAMETERS:

> 1. txOutRef: `OutRef`
> 2. msg: `string`

RESPONSE:
> tx: `channelClaimTx`

## Multi-claim Channel
**url:** /multi-claim
PARAMETERS:

> 1. MappedOutrefsMsgs: `list of (OutRef, string)`

RESPONSE:
> tx: `channelClaimsTx`

## Close Channel
**url:** /close
PARAMETERS:

> 1. txOutRef: `OutRef`

RESPONSE:
> tx: `closedChannelTx`

# Contract Queries

## Channels given a channelID
**url:** /channels-with-id
PARAMETERS:

> 1. channelId?: `bigint`

RESPONSE:
> channels: `list of Channel`

Where

> Channel:
>> 1. channelId: `bigint`
>> 2. nonce: `bigint`
>> 3. active: `boolean`
>> 4. balance: `bigint`
>> 5. senderAddress: `string`
>> 6. signerAddress: `string`
>> 7. receiverAddress: `string`

## Channels from a particular sender
**url:** /channels-from-sender
PARAMETERS:

> 1. senderAddress?: `string`

RESPONSE:
> channels: `list of Channel`


## Channels from a particular receiver
**url:** /channels-from-receiver
PARAMETERS:

> 1. receiverAddress?: `string`

RESPONSE:
> channels: `list of Channel`
