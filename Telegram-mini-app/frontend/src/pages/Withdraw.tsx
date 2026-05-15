import { useContracts } from "../hooks/useContracts";

export default function Withdraw() {
  const { address, isConnected } = useContracts();

  if (!isConnected) {
    return (
      <section className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-2">💰</div>
          <p className="text-lg text-gray-500 mb-4">Connect wallet to withdraw</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">Wallet</h2>
      <p className="text-center text-sm text-gray-500">Manage your withdrawals from the Trestle protocol.</p>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <button disabled className="w-full py-3.5 bg-emerald-500/50 text-white font-medium rounded-xl cursor-not-allowed">
          Withdraw MATIC
        </button>
        <button disabled className="w-full py-3.5 bg-blue-500/50 text-white font-medium rounded-xl cursor-not-allowed">
          Withdraw Tokens
        </button>
        <p className="text-[10px] text-gray-400 text-center pt-2">Withdrawal functionality coming soon</p>
      </div>
    </div>
  );
}