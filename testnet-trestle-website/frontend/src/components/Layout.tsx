import { Outlet, NavLink } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import WalletStatus from "./WalletStatus";

export default function Layout() {
  const { isCorrectChain, chainName } = useContracts();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-emerald-600">Trestle</h1>
          <WalletStatus />
        </div>
        {!isCorrectChain && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded text-center">
            Switch to Polygon Amoy or Polygon Mainnet
          </div>
        )}
        {isCorrectChain && (
          <div className="mt-1 text-xs text-gray-400 text-center">{chainName}</div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto">
        <div className="flex justify-around py-2">
          <NavLink to="/" className="flex flex-col items-center text-xs text-gray-500">
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/marketplace" className="flex flex-col items-center text-xs text-gray-500">
            <span>Market</span>
          </NavLink>
          <NavLink to="/stake/tier1" className="flex flex-col items-center text-xs text-gray-500">
            <span>Stake</span>
          </NavLink>
          <NavLink to="/withdraw" className="flex flex-col items-center text-xs text-gray-500">
            <span>Wallet</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
