import { ConnectButton } from "thirdweb/react";
import { client } from "../config/web3";
import { polygonAmoy } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

export default function WalletStatus() {
  return (
    <ConnectButton
      client={client}
      chain={polygonAmoy}
      wallets={[
        inAppWallet({
          auth: { options: ["email", "google", "telegram", "discord", "wallet"] },
        }),
      ]}
      theme="light"
      connectButton={{ className: "!text-xs !py-1 !px-3 !h-auto !min-h-0 !rounded-lg" }}
    />
  );
}
