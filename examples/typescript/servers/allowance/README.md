# Allowance Based Server Example

This server works with the allowance client example. It requires callers to pre-approve a facilitator address for USDC transfers. Clients send a simple JSON payment header containing the sender address and amount. The server verifies the allowance and pulls payment using `transferFrom`.

## Setup

1. Copy `.env-local` to `.env` and configure the addresses.
2. Install dependencies from the examples root and build the packages:

```bash
cd ../../
pnpm install
pnpm build
cd servers/allowance
```

3. Start the server:

```bash
pnpm dev
```
