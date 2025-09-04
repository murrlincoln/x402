# Allowance Based Client Example

This example demonstrates how to pre-approve a payment facilitator using the ERC-20 `approve` function so that future x402 payments can be automatically charged using `transferFrom` without additional user signatures.

The demo pairs with the example server in `../servers/allowance` which expects a simple JSON payment header containing the sender address and amount.

## Prerequisites

- Node.js v20+
- pnpm v10
- A running allowance example server (`examples/typescript/servers/allowance`)
- A funded Ethereum private key on Base Sepolia

## Setup

1. Install dependencies from the examples root and build the packages:

```bash
cd ../../
pnpm install
pnpm build
cd clients/allowance
```

2. Copy `.env-local` to `.env` and fill in the required values:

```bash
cp .env-local .env
```

3. Approve the facilitator address to spend your USDC:

```bash
pnpm approve
```

4. Run the demo client:

```bash
pnpm dev
```
