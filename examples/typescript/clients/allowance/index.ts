import { config } from "dotenv";
import axios from "axios";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Hex, Address } from "viem";
import { baseSepolia } from "viem/chains";
import { erc20Abi } from "viem";

config();

const { RESOURCE_SERVER_URL, ENDPOINT_PATH, PRIVATE_KEY, TOKEN_ADDRESS, FACILITATOR_ADDRESS } =
  process.env;

if (
  !RESOURCE_SERVER_URL ||
  !ENDPOINT_PATH ||
  !PRIVATE_KEY ||
  !TOKEN_ADDRESS ||
  !FACILITATOR_ADDRESS
) {
  console.error("Missing environment variables in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as Hex);
const wallet = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
}).extend(publicActions);

const api = axios.create({ baseURL: RESOURCE_SERVER_URL });

api.interceptors.response.use(
  response => response,
  async error => {
    if (!error.response || error.response.status !== 402) {
      return Promise.reject(error);
    }

    const { accepts } = error.response.data as {
      accepts: Array<{
        maxAmountRequired: string;
        scheme: string;
      }>;
    };
    const req = accepts[0];
    const amount = BigInt(req.maxAmountRequired);

    const allowance: bigint = await wallet.readContract({
      address: TOKEN_ADDRESS as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address as Address, FACILITATOR_ADDRESS as Address],
    });

    if (allowance < amount) {
      throw new Error("Insufficient allowance, please run pnpm approve first.");
    }

    const paymentHeader = JSON.stringify({
      from: account.address,
      amount: req.maxAmountRequired,
    });

    error.config.headers = error.config.headers || {};
    error.config.headers["X-PAYMENT"] = paymentHeader;
    error.config.headers["Access-Control-Expose-Headers"] = "X-PAYMENT-RESPONSE";

    return api.request(error.config);
  },
);

api
  .get(ENDPOINT_PATH)
  .then(res => {
    console.log(res.data);
    console.log(res.headers["x-payment-response"]);
  })
  .catch(err => {
    console.error(err.message);
  });
