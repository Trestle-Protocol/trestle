export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

import { formatEther } from "viem";

export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const formatted = formatEther(amount);
  const [whole, fraction] = formatted.split(".");
  return `${whole}.${(fraction ?? "0").slice(0, 4)}`;
}
