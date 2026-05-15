import { useAccount, useChainId, useBalance } from "wagmi";
import { useReadContract, useWriteContract } from "wagmi";
import { formatUnits, type Address, parseUnits } from "viem";
import { CHAIN_CONFIG } from "../config/contracts";

const SUPPORTED = [CHAIN_CONFIG.amoy.id, CHAIN_CONFIG.polygon.id] as const;

const ERC20_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
] as const;

const MARKETPLACE_ABI = [
  { inputs: [{ name: "listingId", type: "uint256" }], name: "buy", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "listingId", type: "uint256" }], name: "getListing", outputs: [{ name: "seller", type: "address" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "listingCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const RWA_ABI = [
  { inputs: [{ name: "account", type: "address" }], name: "whitelisted", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "whitelistUser", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

const PLACEHOLDER = "0x...";
const isReal = (a: string) => a !== PLACEHOLDER && !a.startsWith("0x0000");

// these will be filled after deploy — pulled from env so no hardcoding needed between deploys
const A = (key: string): Address =>
  (import.meta.env[`VITE_${key}`] as Address) ?? PLACEHOLDER as Address;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: native } = useBalance({ address });

  const isCorrectChain = (SUPPORTED as readonly number[]).includes(chainId);
  const chainName = chainId === CHAIN_CONFIG.polygon.id ? CHAIN_CONFIG.polygon.name : chainId === CHAIN_CONFIG.amoy.id ? CHAIN_CONFIG.amoy.name : "Unsupported";

  // tokens — same address on both networks
  const hNOBT = "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD" as Address;
  const brt = "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b" as Address;
  const brtLp = "0xc445b18b3ff85e0691fe416ad91e456f8697b166" as Address;

  // testnet contract addresses (from env)
  const marketplace = A("MARKETPLACE_CORE");
  const digitalRWA = A("DIGITAL_RWA");
  const digitalGoods = A("DIGITAL_GOODS");
  const aiDispute = A("AI_DISPUTE");
  const govToken = A("GOV_TOKEN");

  const { data: hNOBTBal } = useReadContract({ abi: ERC20_ABI, address: hNOBT, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: brtBal } = useReadContract({ abi: ERC20_ABI, address: brt, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: lpBal } = useReadContract({ abi: ERC20_ABI, address: brtLp, functionName: "balanceOf", args: address ? [address] : undefined, query: { enabled: !!address } });

  const { writeContractAsync } = useWriteContract();
  const write = (payload: Parameters<typeof writeContractAsync>[0]) =>
    writeContractAsync(payload as any);

  return {
    address,
    isConnected,
    isCorrectChain,
    chainName,
    balance: native ? formatUnits(native.value, native.decimals) : "0",
    hNOBTBalance: hNOBTBal?.toString() ?? "0",
    brtBalance: brtBal?.toString() ?? "0",
    lpBalance: lpBal?.toString() ?? "0",

    // marketplace
    marketplaceReady: isReal(marketplace) && isCorrectChain,
    marketplaceAddr: marketplace,
    marketplaceABI: MARKETPLACE_ABI,
    buyListing: (id: number, value: string) =>
      write({ abi: MARKETPLACE_ABI, address: marketplace, functionName: "buy", args: [BigInt(id)], value: parseUnits(value, 18) } as any),

    // RWA
    rwaReady: isReal(digitalRWA) && isCorrectChain,
    rwaAddr: digitalRWA,
    rwaABI: RWA_ABI,
  };
}
