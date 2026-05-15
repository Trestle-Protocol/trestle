import { useContracts } from "../hooks/useContracts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const { address, balance } = useContracts();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 md:pt-20 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100" />
        <div className="absolute top-16 right-0 w-60 h-60 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live on Polygon Amoy Testnet
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
            Your Trestle Dashboard
          </h1>

          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Manage your staking, explore the marketplace, and interact with real-world assets.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
            {address ? (
              <>
                <p className="text-sm text-gray-500">
                  Connected: <span className="font-mono">{address.slice(0, 6)}...</span>{address.slice(-4)}
                </p>
                <button
                  onClick={() => alert("Disconnect functionality would go here")}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => alert("Connect wallet functionality would go here")}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Balance Section */}
      <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all p-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-gray-500">Your Balance</p>
          {balance ? (
            <p className="text-3xl font-bold text-gray-900">{parseFloat(balance).toFixed(4)} MATIC</p>
          ) : (
            <LoadingSpinner label="Fetching balance..." />
          )}
          {address && (
            <p className="text-xs text-gray-400 mt-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* QR for mobile access */}
      <div className="text-center">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 inline-block">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent("https://testnet.trestle.website")}&color=059669&bgcolor=ffffff&ecc=M`}
            alt="QR Code"
            className="rounded mx-auto"
          />
          <p className="text-[10px] text-gray-400 mt-1">Scan to open on mobile</p>
        </div>
      </div>
    </div>
  );
}