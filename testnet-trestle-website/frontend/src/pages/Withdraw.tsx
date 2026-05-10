import { useContracts } from "../hooks/useContracts";
import { useAccount } from "wagmi";

export default function Withdraw() {
  const { address, isConnected } = useContracts();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect wallet to withdraw</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Wallet</h2>
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <button className="w-full py-3 bg-emerald-500 rounded-lg text-white font-medium">
          Withdraw MATIC
        </button>
        <button className="w-full py-3 bg-blue-500 rounded-lg text-white font-medium">
          Withdraw Tokens
        </button>
      </div>
    </div>
  );
}
