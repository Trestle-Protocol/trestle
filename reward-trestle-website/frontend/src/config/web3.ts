import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID ?? "",
});

export const chain = polygon;

export const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "telegram", "discord", "wallet"],
    },
  }),
];

export const CONTRACT_ADDRESSES = {
  polygon: {
    biometricVerification: "0x...",
    rewardDistributor: "0x...",
    hNOBT: "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD",
  },
} as const;
