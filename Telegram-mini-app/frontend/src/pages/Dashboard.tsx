import { useContracts } from "../hooks/useContracts";
import { BROILER_INFO } from "../config/contracts";
import QRCode from "./QRCode";

export default function Dashboard() {
  const { address, balance } = useContracts();

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white text-center">
        <p className="text-xs opacity-80">Your Balance</p>
        <p className="text-2xl font-bold mt-1">{balance ? parseFloat(balance).toFixed(4) : "0.0000"} MATIC</p>
        {address && <p className="text-[10px] opacity-60 mt-1">{address.slice(0, 6)}...{address.slice(-4)}</p>}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <p>⚠ BRT has a {BROILER_INFO.taxPercent}% tax per transfer. Use {BROILER_INFO.recommendedSlippage} slippage.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Earn & Stake</h2>
        {[
          { title: "Tier 1: Stake hNOBT", desc: "Lock hNOBT to mine BroilerPlus", href: "/stake/tier1", color: "emerald" },
          { title: "Tier 2: LP Staking", desc: "Stake BRT/WMATIC LP for rewards", href: "/stake/tier2", color: "blue" },
          { title: "Tier 3: Governor Vault", desc: "Deposit LP for governance tokens", href: "/stake/tier3", color: "purple" },
        ].map((card) => (
          <a key={card.href} href={card.href}
            className={`block p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow`}>
            <h3 className={`font-semibold text-sm text-${card.color}-600`}>{card.title}</h3>
            <p className="text-[11px] text-gray-500 mt-1">{card.desc}</p>
          </a>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Marketplace</h2>
        <a href="/marketplace" className="block p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-sm text-amber-600">Digital Goods & Freelancers</h3>
          <p className="text-[11px] text-gray-500 mt-1">Browse listings, buy digital assets, hire freelancers</p>
        </a>
      </div>

      <div className="text-center py-4">
        <QRCode value="https://testnet.trestle.website" size={120} />
      </div>
    </div>
  );
}