import { useContracts } from "../hooks/useContracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Withdraw() {
  const { address, isConnected } = useContracts();

  if (!isConnected) {
    return (
      <section className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-2">💰</div>
          <p className="text-lg text-gray-500 mb-4">Connect wallet to withdraw</p>
          <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/withdraw")}&color=059669&bgcolor=ffffff&ecc=M`}
              alt="QR"
              className="rounded-lg mx-auto mb-2"
            />
            <p className="text-[10px] text-gray-400 font-medium">Scan with wallet to connect</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="pt-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Wallet</h2>
          <p className="text-center text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Manage your withdrawals from the Trestle protocol.
          </p>
        </div>
      </section>

      <section className="pt-4">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all p-8 space-y-6">
            <div className="flex flex-col gap-4">
              <button className="w-full py-4 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 hover:shadow-emerald-300 disabled:opacity-50" disabled>
                Withdraw MATIC
              </button>
              <button className="w-full py-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition shadow-lg shadow-blue-200 hover:shadow-blue-300 disabled:opacity-50" disabled>
                Withdraw Tokens
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center pt-2">Withdrawal functionality coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}