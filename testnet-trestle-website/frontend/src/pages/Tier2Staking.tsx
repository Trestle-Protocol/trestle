import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO, CONTRACT_ADDRESSES } from "../config/contracts";

export default function Tier2Staking() {
  const { isConnected } = useContracts();
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"stake" | "unstake">("stake");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect wallet to stake LP tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 2: LP Staking</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Set slippage to {BROILER_INFO.recommendedSlippage} on DEX.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <p>Pair: {BROILER_INFO.lpPair} on QuickSwap</p>
        <p className="font-mono mt-1 break-all">{CONTRACT_ADDRESSES.polygon.brtLp}</p>
        <a href={`https://quickswap.exchange/pool/v2/${CONTRACT_ADDRESSES.polygon.brtLp}`} target="_blank" rel="noopener noreferrer"
          className="text-blue-500 underline mt-1 inline-block">Add Liquidity →</a>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setAction("stake")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${action === "stake" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>Stake</button>
          <button onClick={() => setAction("unstake")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${action === "unstake" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"}`}>Unstake</button>
        </div>

        <input type="number" placeholder="LP Token Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm" />

        <button className="w-full py-3 bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50" disabled={!amount}>
          {action === "stake" ? "Stake LP" : "Unstake LP"}
        </button>
      </div>
    </div>
  );
}
