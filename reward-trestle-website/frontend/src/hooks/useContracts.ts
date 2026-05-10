import { getContract } from "thirdweb";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { client, chain, CONTRACT_ADDRESSES } from "../config/web3";
import { prepareContractCall } from "thirdweb";

const REWARD_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "claimId", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "lastClaimTime",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "claimWindowStart",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "claimInterval",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "usedClaims",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [{ name: "_key", type: "address" }],
    name: "setVerifierKey",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [
      { name: "start", type: "uint256" },
      { name: "intervalSec", type: "uint256" },
    ],
    name: "setClaimWindow",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "fundRewards",
    type: "function",
    stateMutability: "nonpayable",
  },
] as const;

const HNOBT_ABI = [
  {
    inputs: [{ name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

const BIOMETRIC_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isEligible",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

const BIOMETRIC_FULL_ABI = [
  ...BIOMETRIC_ABI,
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getIdentity",
    outputs: [
      { name: "biometricHash", type: "bytes32" },
      { name: "sybilScore", type: "uint256" },
      { name: "fullyVerified", type: "bool" },
      { name: "lastVerification", type: "uint256" },
    ],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [
      { name: "accountType", type: "string" },
      { name: "identifier", type: "string" },
    ],
    name: "linkAccount",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [
      { name: "biometricHash", type: "bytes32" },
      { name: "linkedIdentifiers", type: "string[]" },
    ],
    name: "submitBiometric",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [{ name: "source", type: "string" }],
    name: "setSource",
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "userSource",
    outputs: [{ name: "", type: "string" }],
    type: "function",
    stateMutability: "view",
  },
] as const;

function rewardContract() {
  return getContract({
    client,
    chain,
    address: CONTRACT_ADDRESSES.polygon.rewardDistributor,
    abi: REWARD_ABI,
  });
}

function hNOBTContract() {
  return getContract({
    client,
    chain,
    address: CONTRACT_ADDRESSES.polygon.hNOBT,
    abi: HNOBT_ABI,
  });
}

function biometricContract() {
  return getContract({
    client,
    chain,
    address: CONTRACT_ADDRESSES.polygon.biometricVerification,
    abi: BIOMETRIC_FULL_ABI,
  });
}

export function useContracts() {
  const account = useActiveAccount();
  const address = account?.address;
  const { mutate: sendTx } = useSendTransaction();

  const { data: hNOBTBalance } = useReadContract({
    contract: hNOBTContract(),
    method: "balanceOf",
    params: address ? [address] : undefined,
  });

  const { data: lastClaimTime } = useReadContract({
    contract: rewardContract(),
    method: "lastClaimTime",
    params: address ? [address] : undefined,
  });

  const { data: claimWindowStart } = useReadContract({
    contract: rewardContract(),
    method: "claimWindowStart",
  });

  const { data: claimInterval } = useReadContract({
    contract: rewardContract(),
    method: "claimInterval",
  });

  const { data: isEligible } = useReadContract({
    contract: biometricContract(),
    method: "isEligible",
    params: address ? [address] : undefined,
  });

  const { data: identity } = useReadContract({
    contract: biometricContract(),
    method: "getIdentity",
    params: address ? [address] : undefined,
  });

  const { data: owner } = useReadContract({
    contract: rewardContract(),
    method: "owner",
  });

  const { data: userSource } = useReadContract({
    contract: biometricContract(),
    method: "userSource",
    params: address ? [address] : undefined,
  });

  const claim = async (amount: string, claimId: `0x${string}`, signature: `0x${string}`) => {
    const tx = prepareContractCall({
      contract: rewardContract(),
      method: "claim",
      params: [amount, claimId, signature],
    });
    await sendTx(tx);
  };

  const linkAccount = async (accountType: string, identifier: string) => {
    const tx = prepareContractCall({
      contract: biometricContract(),
      method: "linkAccount",
      params: [accountType, identifier],
    });
    await sendTx(tx);
  };

  const submitBiometric = async (hash: `0x${string}`, identifiers: string[]) => {
    const tx = prepareContractCall({
      contract: biometricContract(),
      method: "submitBiometric",
      params: [hash, identifiers],
    });
    await sendTx(tx);
  };

  const setSource = async (source: string) => {
    const tx = prepareContractCall({
      contract: biometricContract(),
      method: "setSource",
      params: [source],
    });
    await sendTx(tx);
  };

  return {
    address,
    isConnected: !!address,
    hNOBTBalance: hNOBTBalance?.toString() ?? "0",
    lastClaimTime: lastClaimTime ? Number(lastClaimTime) : 0,
    claimWindowStart: claimWindowStart ? Number(claimWindowStart) : 0,
    claimInterval: claimInterval ? Number(claimInterval) : 0,
    isEligible: isEligible ?? false,
    identity: identity
      ? {
          biometricHash: (identity as any)[0] as string,
          sybilScore: Number((identity as any)[1]),
          fullyVerified: (identity as any)[2] as boolean,
          lastVerification: Number((identity as any)[3]),
        }
      : null,
    owner: owner as string | undefined,
    isOwner: owner !== undefined && address !== undefined && owner.toLowerCase() === address.toLowerCase(),
    userSource: userSource as string | undefined,
    claim,
    linkAccount,
    submitBiometric,
    setSource,
  };
}
