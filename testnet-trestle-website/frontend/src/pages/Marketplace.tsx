import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO } from "../config/contracts";

export default function Marketplace() {
  const { isConnected, isCorrectChain } = useContracts();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect wallet to browse marketplace</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Marketplace</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Set slippage to {BROILER_INFO.recommendedSlippage} when trading.</p>
      </div>

      <p className="text-sm text-gray-500">
        Digital goods and freelancer services with 3% fee. Secure milestone escrow. BRT/WMATIC LP on QuickSwap.
      </p>

      <div className="bg-white rounded-xl border p-4 text-center text-gray-400">
        <p>No listings yet — be the first!</p>
      </div>
    </div>
  );
}
