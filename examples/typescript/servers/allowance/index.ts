import { config } from "dotenv";
import express from "express";
import { createWalletClient, createPublicClient, http, publicActions } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { Hex, Address } from "viem";
import { erc20Abi } from "viem";

config();

const { PRIVATE_KEY, PAY_TO, TOKEN_ADDRESS } = process.env;

if (!PRIVATE_KEY || !PAY_TO || !TOKEN_ADDRESS) {
  console.error("Missing environment variables in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as Hex);
const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
}).extend(publicActions);
const client = createPublicClient({ chain: baseSepolia, transport: http() });

const app = express();

app.get("/demo", async (req, res) => {
  const paymentHeader = req.header("X-PAYMENT");
  const paymentRequirements = {
    scheme: "allowance",
    network: "base-sepolia",
    maxAmountRequired: "1000",
    resource: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    description: "Demo access",
    mimeType: "",
    payTo: PAY_TO,
    maxTimeoutSeconds: 60,
    asset: TOKEN_ADDRESS,
  };

  if (!paymentHeader) {
    res.status(402).json({ x402Version: 1, accepts: [paymentRequirements] });
    return;
  }

  let payment: { from: string; amount: string };
  try {
    payment = JSON.parse(paymentHeader);
  } catch {
    res.status(402).json({
      x402Version: 1,
      error: "malformed payment header",
      accepts: [paymentRequirements],
    });
    return;
  }

  const allowance: bigint = await client.readContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [payment.from as Address, PAY_TO as Address],
  });

  if (allowance < BigInt(payment.amount)) {
    res.status(402).json({
      x402Version: 1,
      error: "insufficient_allowance",
      accepts: [paymentRequirements],
    });
    return;
  }

  try {
    const tx = await wallet.writeContract({
      address: TOKEN_ADDRESS as Address,
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [payment.from as Address, PAY_TO as Address, BigInt(payment.amount)],
    });
    await wallet.waitForTransactionReceipt({ hash: tx });
    res.setHeader("X-PAYMENT-RESPONSE", tx);
    res.json({ success: true });
  } catch (err) {
    res.status(402).json({
      x402Version: 1,
      error: (err as Error).message,
      accepts: [paymentRequirements],
    });
  }
});

app.listen(4025, () => {
  console.log("Server listening on http://localhost:4025");
});
