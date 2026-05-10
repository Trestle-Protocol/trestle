import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { CHAIN_CONFIG } from "../config/contracts";

const SUPPORTED_CHAIN_IDS = [CHAIN_CONFIG.amoy.id, CHAIN_CONFIG.polygon.id];

export function useContracts() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const address = account?.address;
  const isConnected = !!address;
  const chainId = chain?.id ?? 0;

  const isCorrectChain = SUPPORTED_CHAIN_IDS.includes(chainId);

  const chainName = chainId === CHAIN_CONFIG.polygon.id
    ? CHAIN_CONFIG.polygon.name
    : chainId === CHAIN_CONFIG.amoy.id
      ? CHAIN_CONFIG.amoy.name
      : "Unsupported";

  return { address, isConnected, isCorrectChain, chainName, balance: "0" };
}
