import { useState } from "react";
import { useContracts } from "../hooks/useContracts";

export default function Tier3Vault() {
  const { isConnected } = useContracts();
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect wallet to access Governor Vault</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tier 3: Governor Vault</h2>
      <p className="text-sm text-gray-500">
        Deposit LP tokens into the ERC-4626 vault. Earn Governance tokens + marketplace fee share.
      </p>

      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
        <h3 className="font-medium text-purple-700 text-sm">Loyalty Multipliers</h3>
        <ul className="text-xs text-purple-600 mt-2 space-y-1">
          <li>1 month staked: 1x GOV rewards</li>
          <li>6 months staked: 1.5x GOV rewards</li>
          <li>1 year staked: 2x GOV rewards</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <input
          type="number"
          placeholder="LP Token Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm"
        />
        <button
          disabled={!amount}
          className="w-full py-3 bg-purple-500 rounded-lg text-white font-medium disabled:opacity-50"
        >
          Deposit LP
        </button>
      </div>
    </div>
  );
}
