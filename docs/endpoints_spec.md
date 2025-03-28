# Contract Endpoints

## Notation
The *senderAddress* and *receiverAddress* parameters will be `string`s in `bech32` format, e.g. addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej.
The `channelId` type is a string that represents a transaction UTxO Ref, which has concatenated its txHash with the output index.

## Open Channel

**url:** /open
PARAMETERS:

> 1. *senderAddress*: `string`
> 2. *signerPubKey*: `string`
> 3. *receiverAddress*: `string`
> 4. *initialDeposit*: `bigint`
> 5. *expirationDate*: `bigint`
> 6. *groupId*: `string`

RESPONSE:
> 1. *openChannelCbor*: `string`
> 2. *channelId*: `channelId`

## Update Channel
**url:** /update
PARAMETERS:

> 1. *channelId*: `channelId`
> 2. *addDeposit*?: `bigint`
> 3. *expirationDate*?: `bigint`

RESPONSE:
> 1. *updatedChannelCbor*: `string`

## Claim Channel
**url:** /claim
PARAMETERS:

> 1. *channelId*: `list of channelId`

RESPONSE:
> 1. *channelClaimCbor*: `string`


## Close Channel
**url:** /close
PARAMETERS:

> 1. *channelId*: `channelId`

RESPONSE:
> 1. *closedChannelCbor*: `string`

# Contract Queries

## Channels given a channelId

**url:** /channels-with-id
PARAMETERS:

> 1. *channelId?*: `channelId`

RESPONSE:
> 1. *channels*: `list of Channel`

Where

> `Channel`:
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

> 1. *senderAddress?*: `string`

RESPONSE:
> 1. *channels*: `list of Channel`


## Channels from a particular receiver
**url:** /channels-from-receiver
PARAMETERS:

> 1. *receiverAddress?*: `string`

RESPONSE:
> 1. *channels*: `list of Channel`
