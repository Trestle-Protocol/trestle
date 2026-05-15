import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO } from "../config/contracts";

export default function Tier2Staking() {
  const { address, isConnected, isCorrectChain } = useContracts();
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-gray-500">Connect wallet to stake LP tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 2: LP Staking</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[10px] text-blue-700">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax. Slippage: {BROILER_INFO.recommendedSlippage}</p>
        <p>Pair: {BROILER_INFO.lpPair}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <input type="number" placeholder="LP Token Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button disabled={!amount || !isCorrectChain}
          className="w-full py-3 rounded-lg text-white font-medium disabled:opacity-50 bg-blue-500 hover:bg-blue-600">
          Stake BRT/WMATIC LP
        </button>
      </div>
    </div>
  );
}