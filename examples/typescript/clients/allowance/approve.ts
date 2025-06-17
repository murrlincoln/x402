import { config } from "dotenv";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { Hex, Address } from "viem";
import { erc20Abi } from "viem";

config();

const { PRIVATE_KEY, TOKEN_ADDRESS, FACILITATOR_ADDRESS } = process.env;

if (!PRIVATE_KEY || !TOKEN_ADDRESS || !FACILITATOR_ADDRESS) {
  console.error("Missing environment variables in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as Hex);

const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
}).extend(publicActions);

/**
 * Approves the facilitator to spend USDC on behalf of the user.
 */
async function main() {
  const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  const tx = await wallet.writeContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [FACILITATOR_ADDRESS as Address, maxUint256],
  });
  await wallet.waitForTransactionReceipt({ hash: tx });
  console.log(`Approved ${FACILITATOR_ADDRESS}`);
}

main();
