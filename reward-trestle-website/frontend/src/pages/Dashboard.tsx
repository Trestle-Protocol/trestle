import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";

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

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Trestle</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          Sign in with email, Google, Telegram or wallet to start earning rewards.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent("https://reward.trestle.website")}&color=059669&bgcolor=ffffff&ecc=M`}
            alt="QR Code"
            className="rounded-lg mx-auto mb-2"
          />
          <p className="text-[10px] text-gray-400 font-medium">
            Scan with mobile wallet to connect
          </p>
        </div>
        <div className="space-y-2 text-xs text-gray-400 mt-6">
          <p>• Complete tasks to earn hNOBT</p>
          <p>• Build streaks for bonus multipliers</p>
          <p>• Biometric verification prevents bots</p>
        </div>
      </div>
    );
  }

  if (!isConnected && address) return <LoadingSpinner label="Connecting..." />;

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-emerald-600">Connected!</h2>
        <p className="text-gray-600">Address: {address ? `${(address as string).slice(0, 6)}...${(address as string).slice(-4)}` : 'Connecting...'}</p>
      </div>
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
        <p className="text-sm opacity-80">Tap the <span className="font-bold">📱 Open</span> button in the header to access this page on mobile</p>
      </div>
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-emerald-600">Dashboard Working</h2>
        <p className="text-gray-600">If you see this, the basic layout is working.</p>
      </div>
    </div>
  );
}