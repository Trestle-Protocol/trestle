import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Claim() {
  const { address } = useActiveAccount();
  const { isConnected, isEligible, lastClaimTime, claimWindowStart, claimInterval, hNOBTBalance, claim } = useContracts();
  const [claiming, setClaiming] = useState(false);
  const [pendingReward, setPendingReward] = useState("0");
  const [breakdown, setBreakdown] = useState<any>(null);

  useEffect(() => {
    if (!address) return;
    api<{ pendingReward: { total: string; breakdown: any } }>(`/api/users/${address}`)
      .then(u => {
        setPendingReward(u.pendingReward?.total || "0");
        setBreakdown(u.pendingReward?.breakdown || null);
      })
      .catch(console.error);
  }, [address]);

  const now = Math.floor(Date.now() / 1000);
  const windowOpen = now >= claimWindowStart;
  const canClaim = windowOpen && (lastClaimTime + claimInterval <= now || lastClaimTime === 0) && pendingReward !== "0";
  const nextClaim = lastClaimTime > 0
    ? new Date((lastClaimTime + claimInterval) * 1000).toLocaleDateString()
    : "Ready";

  if (!isConnected) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-2">💰</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">Sign in to claim rewards</h2>
      <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mt-4">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://reward.trestle.website/claim")}&color=059669&bgcolor=ffffff&ecc=M`}
          alt="QR"
          className="rounded-lg mx-auto mb-2"
        />
        <p className="text-[10px] text-gray-400 font-medium">Scan with wallet to connect</p>
      </div>
    </div>
  );

  const handleClaim = async () => {
    if (!canClaim || !isEligible || !address) return;
    setClaiming(true);
    try {
      const { claimId, amount, signature } = await api<{ claimId: string; amount: string; signature: string }>(
        `/api/users/${address}/claim`, { method: "POST" }
      );
      await claim(amount as `${number}`, `0x${claimId.slice(2)}` as `0x${string}`, signature as `0x${string}`);
      setPendingReward("0");
      setBreakdown(null);
    } catch (e: any) {
      alert(e.message);
    }
    setClaiming(false);
  };

  const displayReward = pendingReward !== "0" ? (BigInt(pendingReward) / 10n ** 18n).toString() : "0";

  return (
    <div className="space-y-6">
      {!isEligible && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Verify your identity first. <a href="/verify" className="underline font-medium">Verify now</a>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="font-semibold mb-4">Claim Your Rewards</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Accumulated</p>
            <p className="text-lg font-bold text-emerald-600">{displayReward} hNOBT</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Multiplier</p>
            <p className="text-lg font-bold text-emerald-600">
              {breakdown ? `${(parseFloat(breakdown.tier_multiplier || 1) * parseFloat(breakdown.source_bonus || 1) * parseFloat(breakdown.streak_bonus || 1)).toFixed(2)}x` : "--x"}
            </p>
          </div>
        </div>

        <div className={`rounded-lg p-3 text-sm ${canClaim ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"}`}>
          {windowOpen
            ? canClaim ? `Ready to claim (${displayReward} hNOBT)` : `Next claim: ${nextClaim}`
            : `Window opens ${new Date(claimWindowStart * 1000).toLocaleDateString()}`}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-amber-800">How it Works</h3>
        <ul className="text-xs text-amber-700 mt-2 space-y-1">
          <li>1. Complete tasks and build streaks (tracked off-chain)</li>
          <li>2. System computes reward + multipliers off-chain</li>
          <li>3. Signed proof generated for your reward</li>
          <li>4. Submit signed claim here to receive hNOBT</li>
          <li>5. Claims available every {claimInterval / 86400}d</li>
        </ul>
      </div>

      <button
        onClick={handleClaim}
        disabled={!canClaim || !isEligible || claiming}
        className="w-full bg-emerald-500 text-white rounded-xl py-4 font-semibold text-lg hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming ? <><LoadingSpinner size={20} label="" /> Claiming...</> : !isEligible ? "Verify First" : !canClaim ? "No Rewards to Claim" : `Claim ${displayReward} hNOBT`}
      </button>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-sm mb-2">Your Stats</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Balance: {parseInt(hNOBTBalance) > 0 ? (parseInt(hNOBTBalance) / 1e18).toFixed(4) : "0.0000"} hNOBT</p>
          <p>Status: {isEligible ? "Verified" : "Not Verified"}</p>
          {breakdown && (
            <>
              <p>Tier: {breakdown.tier_label || "-"} ({breakdown.tier_multiplier || "1.0"}x)</p>
              <p>Streak: {breakdown.streak || 0}d ({breakdown.streak_bonus || "1.0"}x)</p>
            </>
          )}
        </div>
      </div>

      <div className="text-center">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 inline-block">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent("https://reward.trestle.website/claim")}&color=059669&bgcolor=ffffff&ecc=M`}
            alt="QR"
            className="rounded mx-auto"
          />
          <p className="text-[10px] text-gray-400 mt-1">Scan to access on mobile</p>
        </div>
      </div>
    </div>
  );
}