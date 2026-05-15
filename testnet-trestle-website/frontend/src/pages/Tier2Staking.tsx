import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO, STAKING_DURATIONS } from "../config/contracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Tier2Staking() {
  const { address, isConnected, isCorrectChain } = useContracts();
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🔒</div>
        <p className="text-gray-500">Connect wallet to stake LP tokens</p>
        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mt-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/stake/tier2")}&color=059669&bgcolor=ffffff&ecc=M`}
            alt="QR"
            className="rounded-lg mx-auto mb-2"
          />
          <p className="text-[10px] text-gray-400 font-medium">Scan with wallet to connect</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tier 2: LP Staking</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Use {BROILER_INFO.recommendedSlippage} slippage.</p>
        <p className="mt-1">Pair: {BROILER_INFO.lpPair}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <input type="number" placeholder="LP Token Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button disabled={!amount || !isCorrectChain}
          className="w-full py-4 rounded-lg text-white font-medium disabled:opacity-50 bg-blue-500 hover:bg-blue-600 transition shadow-lg shadow-blue-200">
          Stake BRT/WMATIC LP
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-sm mb-2">Mining Allocation</h3>
        <div className="space-y-1.5 text-xs">
          {Object.values(BROILER_INFO.miningAllocation).map((item: any) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}