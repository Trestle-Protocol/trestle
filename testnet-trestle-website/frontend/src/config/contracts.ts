export const CONTRACT_ADDRESSES = {
  amoy: {
    tier1Staking: "0x...",
    tier2Staking: "0x...",
    tier3Vault: "0x...",
    marketplaceCore: "0x...",
    digitalGoods: "0x...",
    freelancerEscrow: "0x...",
    aiDisputeResolver: "0x...",
    governanceToken: "0x...",
    feeDistributor: "0x...",
    digitalRWA: "0x...",
    hNOBT: "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD",
    broilerPlus: "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b",
    brtLp: "0xc445b18b3ff85e0691fe416ad91e456f8697b166",
    gnosisSafe: "0x64A7ef92229D2D97d1C4fd3DB15Db2d94d3D66F6",
  },
  polygon: {
    tier1Staking: "0x...",
    tier2Staking: "0x...",
    hNOBT: "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD",
    broilerPlus: "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b",
    brtLp: "0xc445b18b3ff85e0691fe416ad91e456f8697b166",
    gnosisSafe: "0x64A7ef92229D2D97d1C4fd3DB15Db2d94d3D66F6",
  },
} as const;

export const CHAIN_CONFIG = {
  amoy: {
    id: 80002,
    name: "Polygon Amoy",
    rpc: "https://rpc-amoy.polygon.technology/",
    explorer: "https://www.oklink.com/amoy",
    currency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  polygon: {
    id: 137,
    name: "Polygon Mainnet",
    rpc: "https://polygon-rpc.com/",
    explorer: "https://polygonscan.com/",
    currency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
} as const;

export const BROILER_INFO = {
  supply: "1,000,000,000,000,000",
  supplyDisplay: "1 Quadrillion",
  taxBps: 500,
  taxPercent: 5,
  recommendedSlippage: "6-7%",
  lpPair: "BRT/WMATIC",
  miningAllocation: {
    lpMining: { pct: 60, label: "Broiler LP Mining" },
    team: { pct: 24, label: "Team & Future Employees" },
    community: { pct: 10, label: "Community / Airdrop" },
    bugBounty: { pct: 5, label: "Bug Bounty" },
    advisors: { pct: 1, label: "Advisors" },
  },
} as const;

export const STAKING_DURATIONS = [
  { id: 0, label: "3 Months", seconds: 90 * 86400, multiplier: "1x" },
  { id: 1, label: "6 Months", seconds: 180 * 86400, multiplier: "1.5x" },
  { id: 2, label: "12 Months", seconds: 365 * 86400, multiplier: "2x" },
] as const;
