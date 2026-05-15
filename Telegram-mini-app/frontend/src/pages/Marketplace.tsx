import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO } from "../config/contracts";

export default function Marketplace() {
  const { isConnected, isCorrectChain } = useContracts();

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔐</div>
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
      {!isCorrectChain && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-xs text-red-700">Switch to Polygon Amoy to interact with testnet marketplace.</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400">
        <p className="text-sm">No listings yet — be the first!</p>
      </div>
    </div>
  );
}