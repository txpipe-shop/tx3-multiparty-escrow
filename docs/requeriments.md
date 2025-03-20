# MultiParty Escrow Requirements

## Summary
The MultiParty Escrow (MPE) smart contract, manages payment channels in [SingularityNET](https://singularitynet.io/) (AI marketplace) between **clients** (senders, consumers or service customers) and AI **service providers** (receivers, recipients). The MPE must:
- Enable clients to create and deposit tokens into payment channels.
- Permit service providers to claim these funds.

The contract allows **clients** to fund channels that associate them with a **service provider**. When using an AI service, clients generate a message that must be signed by the **signer**, indicating the amount owed to the service provider up to that moment. With this message, the provider can claim the amount specified in the message from the channel (at most).

## Identified use cases

### Minimal case
**Context:** Basic usage of the channel.
- A user creates a channel with a specific service provider, initial deposit and initial expiration date indicating who the client and the signer will be.
- The client consumes one or more services provided by the service provider, creating a signed message (or payment claim) that indicates the current claimable amount for the service provider.
- The service provider claims funds providing the generated payment claim.
- The provider can close the channel, in which case the remaining funds return to the client.
### Client withdrawal
**Context**: A channel expires (and there are funds remaining in the channel)
- The channel expires.
- The client claims all the remaining funds at the channel.
### Extension of expiration date
**Context**: A client wants to keep using the payment channel even after the initial specified expiration date.
- The client changes the expiration date of the channel to a further one, before it expires.
### Addition of channel funds
**Context**: Someone wants to add more funds to an active channel.
- A user adds tokens (AGIX) to a channel before it expired.
### Claim funds
**Context**: One or more services from a service provider were consumed and the channel is still active.
- The service provider claims funds from the channel, submitting the signer’s signed message/s to the contract.
- The contract verifies:
  - The authenticity of the signer's signature.
  - That the channel has not expired.
- After successful verification, the claimed amount is transferred to the the service provider's address.
- The service provider can close the channel, in which case, remaining funds are returned to the client.
### Multi Channel Claim
**Context**: One or more services have been consumed through different channels of the same provider, and these channels remain active.
- The service provider claims funds from different channels, submitting the signer’s signed messages to the contract.
- The contract verifies:
  - The authenticity of the signer's signature for every message.
  - That the channels have not expired.
- After successful verification, the claimed amount is transferred to the the service provider's address.
- The service provider can choose to close each channel, in which case, remaining funds are returned to the client/s.
### Consumption of service
**Context**: A client has a channel with a service provider that is active (i.e. it has not expired) and has sufficient funds to consume a service.
- The client specifies the service they want to consume.
- The signer signs a message indicating the accrued payable amount up to that moment.
