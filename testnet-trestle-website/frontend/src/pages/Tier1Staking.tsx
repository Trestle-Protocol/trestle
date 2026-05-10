import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO, STAKING_DURATIONS } from "../config/contracts";

export default function Tier1Staking() {
  const { address, isConnected, isCorrectChain } = useContracts();
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(0);
  const [action, setAction] = useState<"stake" | "unstake">("stake");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect wallet to stake hNOBT</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 1: Stake hNOBT</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
        <p>⚠ BroilerPlus (BRT) has a {BROILER_INFO.taxPercent}% tax on every transfer. Set slippage to {BROILER_INFO.recommendedSlippage} when swapping.</p>
        <p>Supply: {BROILER_INFO.supplyDisplay} BRT</p>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setAction("stake")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${action === "stake" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>Stake</button>
          <button onClick={() => setAction("unstake")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${action === "unstake" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"}`}>Unstake</button>
        </div>

        {action === "stake" && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lock Duration</label>
            <div className="flex gap-2 mb-3">
              {STAKING_DURATIONS.map((d) => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className={`flex-1 py-2 rounded-lg text-sm ${duration === d.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {d.label}
                  <span className="block text-xs opacity-70">{d.multiplier}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm" />

        {action === "stake" && (
          <p className="text-xs text-gray-400 text-center">
            Lock hNOBT for {STAKING_DURATIONS[duration].label}. Earn BroilerPlus at {STAKING_DURATIONS[duration].multiplier} reward rate. No early unstake.
          </p>
        )}

        <button disabled={!amount || !isCorrectChain}
          className={`w-full py-3 rounded-lg text-white font-medium disabled:opacity-50 ${action === "stake" ? "bg-emerald-500" : "bg-red-500"}`}>
          {action === "stake" ? `Stake hNOBT (${STAKING_DURATIONS[duration].label})` : "Unstake hNOBT"}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-2">Broiler Mining Allocation</h3>
        <div className="space-y-1.5">
          {Object.values(BROILER_INFO.miningAllocation).map((item) => (
            <div key={item.label} className="flex justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">{item.pct}%</span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {Object.values(BROILER_INFO.miningAllocation).map((item) => (
            <div key={item.label} className="h-full" style={{ width: `${item.pct}%`, background: item.pct >= 50 ? "#22c55e" : item.pct >= 10 ? "#3b82f6" : "#a855f7" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
