import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO, STAKING_DURATIONS } from "../config/contracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Tier1Staking() {
  const { address, isConnected, isCorrectChain } = useContracts();
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(0);
  const [action, setAction] = useState<"stake" | "unstake">("stake");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-gray-500 mb-4">Connect wallet to stake hNOBT</p>
        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/stake/tier1")}&color=059669&bgcolor=ffffff&ecc=M`}
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
      <h2 className="text-xl font-semibold">Tier 1: Stake hNOBT</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Set slippage to {BROILER_INFO.recommendedSlippage}.</p>
        <p>Supply: {BROILER_INFO.supplyDisplay} BRT</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setAction("stake")}
            className={`flex-1 py-3 rounded-lg text-sm font-medium ${action === "stake" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
            Stake
          </button>
          <button onClick={() => setAction("unstake")}
            className={`flex-1 py-3 rounded-lg text-sm font-medium ${action === "unstake" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
            Unstake
          </button>
        </div>

        {action === "stake" && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Lock Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {STAKING_DURATIONS.map((d) => (
                <button key={d.id} onClick={() => setDuration(d.id)}
                  className={`p-3 rounded-xl text-sm text-center ${duration === d.id ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-emerald-200"}`}>
                  <div className="font-medium">{d.label}</div>
                  <div className="text-[10px] opacity-70">{d.multiplier}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Amount</label>
          <input type="number" placeholder="Amount" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        {action === "stake" && (
          <p className="text-xs text-gray-400 text-center">
            Lock hNOBT for {STAKING_DURATIONS[duration].label}. Earn BroilerPlus at {STAKING_DURATIONS[duration].multiplier} reward rate.
          </p>
        )}

        <button disabled={!amount || !isCorrectChain}
          className={`w-full py-4 rounded-xl text-white font-medium disabled:opacity-50 ${action === "stake" ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200" : "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"} transition-colors`}>
          {action === "stake"
            ? `Stake hNOBT (${STAKING_DURATIONS[duration].label})`
            : "Unstake hNOBT"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-sm mb-2">Mining Allocation</h3>
        <div className="space-y-1.5 text-xs">
          {Object.values(BROILER_INFO.miningAllocation).map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-gray-600">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.pct}%</span>
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: item.pct >= 50 ? "#22c55e" : item.pct >= 10 ? "#3b82f6" : "#a855f7" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}