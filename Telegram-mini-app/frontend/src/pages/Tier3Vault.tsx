import { useState } from "react";
import { useContracts } from "../hooks/useContracts";

export default function Tier3Vault() {
  const { isConnected } = useContracts();
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-gray-500">Connect wallet to access Governor Vault</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 3: Governor Vault</h2>
      <p className="text-xs text-gray-500">Deposit LP tokens to earn governance tokens + fee share. Multipliers up to 2x.</p>
      <div className="bg-purple-50 rounded-xl border border-purple-200 p-3">
        <h3 className="font-medium text-purple-700 text-[10px] mb-1">Loyalty Multipliers</h3>
        <ul className="text-[9px] text-purple-600 space-y-0.5">
          <li>1mo: 1x GOV</li>
          <li>6mo: 1.5x GOV</li>
          <li>1yr: 2x GOV</li>
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <input type="number" placeholder="LP Token Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <button disabled={!amount}
          className="w-full py-3 rounded-lg text-white font-medium disabled:opacity-50 bg-purple-500 hover:bg-purple-600">
          Deposit LP
        </button>
      </div>
    </div>
  );
}