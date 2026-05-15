import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Tier3Vault() {
  const { isConnected } = useContracts();
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🔒</div>
        <p className="text-gray-500">Connect wallet to access Governor Vault</p>
        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mt-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/stake/tier3")}&color=059669&bgcolor=ffffff&ecc=M`}
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
      <h2 className="text-xl font-semibold">Tier 3: Governor Vault</h2>
      <p className="text-gray-600 text-sm">Deposit LP tokens to earn governance tokens + fee share. Loyalty multipliers up to 2x.</p>
      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
        <h3 className="font-medium text-purple-700 text-sm mb-2">Loyalty Multipliers</h3>
        <ul className="text-xs text-purple-600 space-y-1">
          <li>1 month: 1x GOV rewards</li>
          <li>6 months: 1.5x GOV rewards</li>
          <li>1 year: 2x GOV rewards</li>
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <input type="number" placeholder="LP Token Amount" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-4 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <button disabled={!amount}
          className="w-full py-4 rounded-lg text-white font-medium disabled:opacity-50 bg-purple-500 hover:bg-purple-600 transition shadow-lg shadow-purple-200">
          Deposit LP
        </button>
      </div>
    </div>
  );
}