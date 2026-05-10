import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";

function LoginPrompt() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🔐</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Trestle</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        Sign in with email, Google, Telegram or wallet to start earning rewards.
      </p>
      <div className="space-y-2 text-xs text-gray-400">
        <p>• Complete tasks to earn hNOBT</p>
        <p>• Build streaks for bonus multipliers</p>
        <p>• Biometric verification prevents bots</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { address, hNOBTBalance, isEligible, isConnected, lastClaimTime, claimWindowStart, claimInterval } = useContracts();
  const [streak, setStreak] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!address) return;
    api<{ streak: number; tasks_done: number; source: string }>(`/api/users/${address}`)
      .then(u => {
        setStreak(u.streak || 0);
        setTasksDone(u.tasks_done || 0);
        setSource(u.source || "");
      })
      .catch(console.error);
  }, [address]);

  if (!isConnected) return <LoginPrompt />;

  const now = Math.floor(Date.now() / 1000);
  const windowOpen = now >= claimWindowStart;
  const canClaim = windowOpen && (lastClaimTime + claimInterval <= now || lastClaimTime === 0);
  const nextClaimDate = lastClaimTime > 0
    ? new Date((lastClaimTime + claimInterval) * 1000).toLocaleDateString()
    : "First claim ready";

  return (
    <div className="space-y-6">
      {!isEligible && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Verify your identity to unlock rewards.{' '}
          <a href="/verify" className="underline font-medium">Start now</a>
        </div>
      )}

      <div className={`rounded-xl p-6 text-white ${isEligible ? "bg-emerald-500" : "bg-gray-400"}`}>
        <p className="text-sm opacity-80">Your hNOBT Balance</p>
        <p className="text-3xl font-bold">
          {parseInt(hNOBTBalance) > 0 ? (parseInt(hNOBTBalance) / 1e18).toFixed(4) : "0.0000"}
        </p>
        {address && (
          <p className="text-xs opacity-60 mt-1">{address.slice(0, 6)}...{address.slice(-4)}</p>
        )}
        <div className="mt-3 flex gap-2">
          {isEligible ? (
            <span className="bg-emerald-400 text-xs px-2 py-0.5 rounded-full">Verified</span>
          ) : (
            <span className="bg-amber-400 text-xs px-2 py-0.5 rounded-full">Unverified</span>
          )}
          {canClaim && isEligible && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Claim Ready</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Streak</p>
          <p className="text-sm font-semibold mt-1">{streak} days</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Tasks Done</p>
          <p className="text-sm font-semibold mt-1">{tasksDone}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-semibold mt-1">{isEligible ? "Eligible" : "Verify identity"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500">Next Claim</p>
          <p className="text-sm font-semibold mt-1">{nextClaimDate}</p>
        </div>
      </div>

      {source && (
        <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">Source</span>
          <span className="text-xs font-medium text-emerald-600">{source}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-amber-800">Early Adopter Multiplier</h3>
        <p className="text-xs text-amber-700 mt-1">
          First 1000 users get 2x rewards. Next 1000 get 1.9x. Complete tasks, build streaks,
          and link accounts to maximize your rewards.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { href: "/tasks", title: "Daily Tasks", desc: "Complete tasks to earn hNOBT" },
          { href: "/verify", title: "Verify Identity", desc: "Link accounts + biometric check" },
          { href: "/leaderboard", title: "Leaderboard", desc: "See where you rank this week" },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition"
          >
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
