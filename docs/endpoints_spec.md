# Contract Endpoints

## Open Channel

**url:** /open
PARAMETERS:

> 1. senderAddress: `string`
> 2. signerPubKey: `string`
> 3. receiverAddress: `string`
> 4. initialDeposit: `bigint`
> 5. expirationDate: `bigint`
> 6. groupId: `string`

RESPONSE:
> 1. openChannelCbor: `string`
> 2. channelId: `string`

## Update Channel
**url:** /update
PARAMETERS:

> 1. txOutRef: `ChannelId`
> 2. addDeposit?: `bigint`
> 3. expirationDate?: `bigint`

Where
> ChannelId:
>> 1. txHash: `string`
>> 2. outputIndex: `number`


RESPONSE:
> updatedChannelCbor: `string`

## Claim Channel
**url:** /claim
PARAMETERS:

> txOutRef: `ChannelId`

RESPONSE:
> channelClaimCbor: `string`

## Multi-claim Channel
**url:** /multi-claim
PARAMETERS:

> 1. mappedOutrefsMsgs: `list of OutRef`

RESPONSE:
> channelClaimsCbor: `string`

## Close Channel
**url:** /close
PARAMETERS:

> 1. txOutRef: `ChannelId`

RESPONSE:
> closedChannelCbor: `string`

## Build Message
**url:** /build-message
PARAMETERS:

> 1. nonce: `bigint`
> 2. txOutRef: `ChannelId`
> 3. amount: `bigint`

RESPONSE:
> message: `string`

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
>> 4. expirationDate: `bigint`
>> 5. balance: `bigint`
>> 6. senderAddress: `string`
>> 7. signerAddress: `string`
>> 8. receiverAddress: `string`

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
