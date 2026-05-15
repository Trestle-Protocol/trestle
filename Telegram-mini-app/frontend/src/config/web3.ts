import { createThirdwebClient } from "thirdweb";
import { polygonAmoy, polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID ?? "",
});

export const chains = [polygonAmoy, polygon];

export const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "telegram", "discord", "wallet"],
    },
  }),
];
