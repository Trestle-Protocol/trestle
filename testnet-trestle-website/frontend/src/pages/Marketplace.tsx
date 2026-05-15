import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO } from "../config/contracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Marketplace() {
  const { isConnected, isCorrectChain, marketplaceReady, marketplaceAddr, marketplaceABI, buyListing } = useContracts();
  const [busy, setBusy] = useState(false);

  if (!isConnected) {
    return (
      <section className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🏪</div>
          <p className="text-lg text-gray-500 mb-4">Connect wallet to browse marketplace</p>
          <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/marketplace")}&color=059669&bgcolor=ffffff&ecc=M`}
              alt="QR"
              className="rounded-lg mx-auto mb-2"
            />
            <p className="text-[10px] text-gray-400 font-medium">Scan with wallet to connect</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="pt-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Marketplace</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">
              ⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Set slippage to {BROILER_INFO.recommendedSlippage} when trading.
            </p>
          </div>

          {!marketplaceReady && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <p className="text-sm text-yellow-700">Marketplace contracts not yet deployed to this network.</p>
            </div>
          )}

          {marketplaceReady && (
            <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-emerald-100 transition-all p-6">
              <p className="text-xs text-gray-500 mb-4">Marketplace coming soon on testnet</p>
              <p className="text-sm text-gray-400 text-center py-4">No listings yet — be the first!</p>
            </div>
          )}

          {!isCorrectChain && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mt-4">
              <p className="text-sm text-red-700">Switch to Polygon Amoy to interact with testnet marketplace.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}