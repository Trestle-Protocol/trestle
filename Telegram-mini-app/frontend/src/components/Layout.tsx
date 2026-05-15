import { Outlet, NavLink } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import WalletStatus from "./WalletStatus";
import QRCode from "./QRCode";
import { Icon } from "./Icon";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/marketplace", label: "Market", icon: "🏪" },
  { to: "/stake/tier1", label: "Stake", icon: "📈" },
  { to: "/withdraw", label: "Wallet", icon: "💰" },
];

export default function Layout() {
  const { isCorrectChain, chainName } = useContracts();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Icon name="logo" size={22} />
            <h1 className="text-xl font-bold text-emerald-600">Trestle</h1>
          </div>
          <div className="flex items-center gap-2">
            <WalletStatus />
            <a
              href="https://t.m/TrestlePro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-500 hover:text-emerald-600 transition"
            >
              <Icon name="telegram" size={16} />
            </a>
          </div>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto z-10">
        <div className="flex justify-around py-2">
          {navLinks.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className="flex flex-col items-center text-[10px] text-gray-500">
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}