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
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-gray-500">Connect wallet to stake hNOBT</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 1: Stake hNOBT</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-700 space-y-1">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax. Slippage: {BROILER_INFO.recommendedSlippage}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setAction("stake")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${action === "stake" ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            Stake
          </button>
          <button onClick={() => setAction("unstake")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${action === "unstake" ? "bg-red-500 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            Unstake
          </button>
        </div>

        {action === "stake" && (
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Lock Duration</label>
            <div className="flex gap-2">
              {STAKING_DURATIONS.map((d) => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className={`flex-1 py-2 rounded-lg text-[10px] text-center ${duration === d.id ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <input type="number" placeholder="Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <button disabled={!amount || !isCorrectChain}
          className={`w-full py-3 rounded-lg text-white font-medium disabled:opacity-50 ${action === "stake" ? "bg-emerald-500" : "bg-red-500"}`}>
          {action === "stake" ? `Stake (${STAKING_DURATIONS[duration].label})` : "Unstake hNOBT"}
        </button>
      </div>
    </div>
  );
}