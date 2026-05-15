import { useAccount, disconnect } from "wagmi";

export default function WalletStatus() {
  const { address, isConnected, disconnect: disconnectWallet } = useAccount();

  if (!isConnected) {
    return (
      <button
        onClick={() => {
          // Since we're using wagmi through useContracts, we should trigger connection
          // through the same mechanism. For now, we'll show a message.
          // In a real implementation, this would trigger the wallet connection flow
          alert("Wallet connection would be triggered through the app's wallet provider");
        }}
        className="px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-xs text-gray-600 font-mono">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        onClick={() => {
          disconnectWallet();
        }}
        className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-xs font-medium rounded-lg transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
