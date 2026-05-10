export const CONTRACT_ADDRESSES = {
  polygon: {
    biometricVerification: "0x...",
    rewardDistributor: "0x...",
    hNOBT: "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD",
  },
} as const;

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const REWARD_CONFIG = {
  claimInterval: 14 * 86400,
  earlyAdopterTiers: [
    { rank: 1, maxUsers: 1000, multiplier: 2.0, label: "Genesis" },
    { rank: 2, maxUsers: 1000, multiplier: 1.9, label: "Early" },
    { rank: 3, maxUsers: 1000, multiplier: 1.8, label: "Supporter" },
    { rank: 4, maxUsers: 1000, multiplier: 1.7, label: "Builder" },
    { rank: 5, maxUsers: 1000, multiplier: 1.6, label: "Contributor" },
  ],
} as const;
