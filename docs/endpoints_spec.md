# Contract Endpoints

## Notation

- **senderAddress** and **receiverAddress**: `string` in `bech32` format (e.g., `addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej`).
- **channelId**: `string` representing a transaction UTxO-Ref, concatenating `txHash` with the output index.

---

## POST Open Channel

**URL:** `/open`

### Parameters:

1. **senderAddress**: `string`
2. **signerPubKey**: `string`
3. **receiverAddress**: `string`
4. **initialDeposit**: `bigint`
5. **expirationDate**: `bigint`
6. **groupId**: `string`

#### Example:

```json
{
  "senderAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej",
  "signerPubKey": "145562a792f2ca28ae87f1f7afd25b126f76547103204f62432999bcc2b5c542",
  "receiverAddress": "addr_test1xyzvwx123fypzcfsz53n5gufc6h84tawp9pdyklm05pr385g",
  "initialDeposit": 1000000n,
  "expirationDate": 1716148967n,
  "groupId": "ZC63QytbzJt75kHGkZ8PEWXXDl2GDFRVwUT1CI2lbwY="
}
```

### Response:

1. **openChannelCbor**: `string`
2. **channelId**: `channelId`

#### Example:

```json
{
  "openChannelCbor": "84a400d9...",
  "channelId": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0"
}
```

---

## POST Update Channel

**URL:** `/update`

### Parameters:

1. **channelId**: `channelId`
2. **addDeposit**: `bigint`
3. **expirationDate**: `bigint`
4. **userAddress**: `string`
5. **senderAddress**: `string`

where **userAddress** is the address of the wallet signing the transaction, and **senderAddress** is the address of the sender agent described in the channel.
#### Example:

```json
{
  "channelId": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0",
  "addDeposit": 500000n,
  "expirationDate": 1716148967n,
  "userAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej",
  "senderAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej",
}
```

### Response:

1. **updatedChannelCbor**: `string`

```json
{
  "updateChannelCbor": "84a400d9..."
}
```

---

## POST Claim Channel

**URL:** `/claim`

### Parameters:

1. **params**: `ClaimParams[]`

```json
where ClaimParams =
 {
    "channelId": `channelId`
    "signature": `string`
    "amount": `bigint`
    "senderAddress": `string`
    "finalize": boolean
}
```

#### Example:

```json
[
    {
  "channelId": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0",
  "signature": "4eb27d97d08c53f4d5d53aabd395e7eaa3a095ac084db3201974146804e1bde14d9340aef918d945912152dcb8f5b00fa8514ac3657c315d37e8580fbcd66400",
  "amount": 1500000n,
  "finalize": false,
  "senderAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej"
}
]
```

### Response:

1. **channelClaimCbor**: `string`

#### Example:

```json
{
  "claimChannelCbor": "84a400d9..."
}
```

---

## POST Close Channel

**URL:** `/close`

### Parameters:

1. **channelId**: `channelId`

#### Example:

```json
{
  "channelId": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0",
  "senderAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej"
}
```

### Response:

1. **closedChannelCbor**: `string`

#### Example:

```json
{
  "closedChannelCbor": "84a400d9..."
}
```

---

&nbsp;

# _Contract Queries_

### Channel Response:

- **txHash**: `string`,
- **outputIndex**: `bigint`,
- **channelId**: `channelId`
- **nonce**: `bigint`
- **active**: `boolean`
- **expirationDate**: `bigint`
- **balance**: `bigint`
- **senderAddress**: `string`
- **signerAddress**: `string`
- **receiverAddress**: `string`

#### Example:

```json
{
    {
      "txHash": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c" ,
      "outputIndex": 0n,
      "channelId": "b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0",
      "nonce": 123n,
      "active": true,
      "expirationDate": 1716148967n,
      "balance": 1000000n,
      "senderAddress": "addr_test1vzwlx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej",
      "signerAddress": "addr_test1vasdcx094fypzcfsz53n5gufc6h84tawp9pdyklm05pr385gl956ej",
      "receiverAddress": "addr_test1xyzvwx123fypzcfsz53n5gufc6h84tawp9pdyklm05pr385g"
    }
}
```

## GET all channels

**URL:** `/channels`

### Response:

1. **channels**: `list of Channel`

## GET Channel by `channelId`

**URL:** `/channel-with-id`

### Parameters:

1. **channelId**: `channelId`

#### Example:

```json
/channel-with-id?channelId="b126f76547103204f62432999bcc2b5cb126f76547103204f62432999bcc2b5c0"
```

### Response:

1. **channel**: `Channel`

---

## GET Channels by Sender

**URL:** `/channels-from-sender`

### Parameters:

1. **senderAddress**: `string`

#### Example:

```json
/channels-from-sender?senderAddress="addr_test1xyzvwx123fypzcfsz53n5gufc6h84tawp9pdyklm05pr385g"
```

### Response:

1. **channels**: `list of Channel`

---

## Query Channels by Receiver

**URL:** `/channels-from-receiver`

### Parameters:

1. **receiverAddress**: `string`

#### Example:

```json
/channels-from-receiver?receiverAddress="addr_test1xyzvwx123fypzcfsz53n5gufc6h84tawp9pdyklm05pr385g"
```

### Response:

1. **channels**: `list of Channel`
