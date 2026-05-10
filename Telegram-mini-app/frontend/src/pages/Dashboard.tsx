import { useContracts } from "../hooks/useContracts";
import StakeCard from "../components/StakeCard";
import { BROILER_INFO } from "../config/contracts";

export default function Dashboard() {
  const { address, balance } = useContracts();

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500 rounded-xl p-6 text-white">
        <p className="text-sm opacity-80">Your Balance</p>
        <p className="text-3xl font-bold">{parseFloat(balance).toFixed(4)} MATIC</p>
        {address && (
          <p className="text-xs opacity-60 mt-1">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        )}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-amber-800">BroilerPlus (BRT)</h3>
        <div className="mt-1 text-xs text-amber-700 space-y-0.5">
          <p>Supply: {BROILER_INFO.supplyDisplay}</p>
          <p>{BROILER_INFO.taxPercent}% tax per transfer — use {BROILER_INFO.recommendedSlippage} slippage</p>
        </div>
        <div className="mt-2 flex gap-2 text-xs">
          {Object.values(BROILER_INFO.miningAllocation).map((item) => (
            <span key={item.label} className="bg-white/60 px-2 py-0.5 rounded">{item.label}: {item.pct}%</span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Earn & Stake</h2>
        <div className="grid gap-3">
          <StakeCard
            title="Tier 1: Stake hNOBT"
            description="Lock hNOBT for 3/6/12 months to mine BroilerPlus. Longer lock = higher rewards."
            to="/stake/tier1"
            color="emerald"
          />
          <StakeCard
            title="Tier 2: Stake LP"
            description="Stake BRT/WMATIC LP tokens and earn mining rewards."
            to="/stake/tier2"
            color="blue"
          />
          <StakeCard
            title="Tier 3: Governor Vault"
            description="Stake LP to earn Governance tokens + real yield. Loyalty multipliers up to 2x."
            to="/stake/tier3"
            color="purple"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Marketplace</h2>
        <StakeCard
          title="Digital Goods & Freelancers"
          description="Browse listings, buy digital assets, and hire freelancers with secure escrow."
          to="/marketplace"
          color="amber"
        />
      </div>
    </div>
  );
}
