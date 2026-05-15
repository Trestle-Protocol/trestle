import { useState, useMemo } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";

const ACCOUNT_TYPES = [
  { id: "wallet", label: "Wallet", icon: "🔗" },
  { id: "email", label: "Email", icon: "📧" },
  { id: "telegram", label: "Telegram", icon: "💬" },
  { id: "discord", label: "Discord", icon: "💎" },
  { id: "forum", label: "Forum", icon: "📋" },
];

const SOURCES = [
  { id: "", label: "Direct / Unknown", icon: "🔗" },
  { id: "telegram", label: "Telegram", icon: "💬" },
  { id: "discord", label: "Discord", icon: "💎" },
  { id: "forum", label: "Community Forum", icon: "📋" },
  { id: "email", label: "Email Campaign", icon: "📧" },
  { id: "google", label: "Google / Search", icon: "🔍" },
  { id: "friend", label: "Friend Referral", icon: "🤝" },
];

export default function Verify() {
  const { address } = useActiveAccount();
  const { isConnected, isEligible, identity, userSource, linkAccount, submitBiometric, setSource } = useContracts();
  const [linked, setLinked] = useState<string[]>(["wallet"]);
  const [step, setStep] = useState<"accounts" | "biometric" | "done">("accounts");
  const [submitting, setSubmitting] = useState(false);

  const refSource = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") ?? "";
  }, []);

  const [selectedSource, setSelectedSource] = useState(
    SOURCES.find(s => s.id === refSource) ? refSource : ""
  );

  if (!isConnected) return <div className="text-center py-12 text-gray-500"><p>Sign in to verify</p></div>;

  if (isEligible) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <p className="text-2xl">✅</p>
        <h2 className="text-lg font-semibold text-emerald-800 mt-2">Fully Verified</h2>
        <p className="text-sm text-emerald-600 mt-1">Sybil Score: {identity?.sybilScore ?? 0}/100</p>
        {userSource && <p className="text-xs text-emerald-500 mt-1">Source: {SOURCES.find(s => s.id === userSource)?.label ?? userSource}</p>}
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (selectedSource) {
        await setSource(selectedSource);
        if (address) await api(`/api/users/${address}/source`, { method: "POST", body: JSON.stringify({ source: selectedSource }) }).catch(() => {});
      }
      const hash = ("0x" + Array(64).fill("0").join("")) as `0x${string}`;
      await submitBiometric(hash, linked);
      setStep("done");
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h2 className="font-semibold mb-1">
          {step === "accounts" ? "Step 1: Link Accounts + Origin" :
           step === "biometric" ? "Step 2: Biometric Verification" :
           "Verification Complete"}
        </h2>
        <p className="text-xs text-gray-500">
          {step === "accounts" && "Link at least 3 accounts and tell us where you found us."}
          {step === "biometric" && "Submit your biometric hash to prove uniqueness."}
        </p>
      </div>

      {step === "accounts" && (
        <>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map(acc => (
              <label
                key={acc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  linked.includes(acc.id) ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={linked.includes(acc.id)}
                  onChange={() => setLinked(prev =>
                    prev.includes(acc.id) ? prev.filter(x => x !== acc.id) : [...prev, acc.id]
                  )}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                />
                <span className="text-lg">{acc.icon}</span>
                <span className="text-sm font-medium">{acc.label}</span>
              </label>
            ))}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="text-sm font-medium block mb-2">Where did you find us?</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSource(s.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition ${
                    selectedSource === s.id
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              <strong>Sybil Score:</strong> {Math.min(linked.length * 15, 100)}/100
              {linked.length >= 3 && " ✅ Eligible"}
            </p>
          </div>

          <button
            onClick={() => setStep("biometric")}
            disabled={linked.length < 3}
            className="w-full bg-emerald-500 text-white rounded-xl py-3 font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue ({linked.length}/3 accounts)
          </button>
        </>
      )}

      {step === "biometric" && (
        <>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-4">
              Origin: <strong>{SOURCES.find(s => s.id === selectedSource)?.label ?? "Direct"}</strong>
            </p>
            <p className="text-xs text-gray-500">
              In production, a decentralized biometric oracle generates a unique hash.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-emerald-500 text-white rounded-xl py-3 font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Complete Verification"}
          </button>
          <button onClick={() => setStep("accounts")} className="w-full text-gray-500 text-sm py-2">
            Back
          </button>
        </>
      )}

      {step === "done" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <p className="text-2xl">🎉</p>
          <h2 className="text-lg font-semibold text-emerald-800 mt-2">Verification Submitted</h2>
          <p className="text-sm text-emerald-600 mt-1">You'll be eligible once processed.</p>
          <a href="/" className="inline-block mt-3 text-emerald-700 underline text-sm">Back to Dashboard</a>
        </div>
      )}
    </div>
  );
}