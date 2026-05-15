import { Outlet, NavLink } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import WalletStatus from "./WalletStatus";
import QRCode from "./QRCode";
import { LoadingSpinner } from "./LoadingSpinner";
import { Icon } from "./Icon";

const navLinks = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/marketplace", label: "Market", icon: "🏪" },
  { to: "/rwa", label: "RWA", icon: "🏠" },
];

export default function Layout() {
  const { isCorrectChain, chainName } = useContracts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <div className="flex items-center gap-2">
                <Icon name="logo" size={22} />
                <h1 className="text-xl font-bold text-emerald-600">Trestle</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WalletStatus />
              <a
                href="https://t.m/TrestlePro"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition bg-gray-50 border border-gray-200 px-2 py-1 rounded"
              >
                <Icon name="telegram" size={14} />
                Support
              </a>
            </div>
          </div>
          <nav className="flex gap-6 mt-3">
            {navLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium flex items-center gap-1.5 ${isActive ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`
                }
              >
                {icon} {label}
              </NavLink>
            ))}
          </nav>
        </div>
        {!isCorrectChain && (
          <div className="p-2 bg-red-100/50 backdrop-blur-sm text-red-700 text-sm text-center">
            Switch to Polygon Amoy or Polygon Mainnet
          </div>
        )}
        {isCorrectChain && (
          <div className="pb-1 text-xs text-gray-400 text-center">{chainName}</div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-4 text-[10px] text-gray-400">
            <a href="https://discord.gg/4dCCvnJYGT" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition flex items-center gap-1">
              <Icon name="discord" size={12} /> Discord
            </a>
            <a href="https://t.m/TrestlePro" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition flex items-center gap-1">
              <Icon name="telegram" size={12} /> Telegram
            </a>
            <a href="mailto:contact@trestle.website" className="hover:text-emerald-500 transition flex items-center gap-1">
              <Icon name="email" size={12} /> contact@trestle.website
            </a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/Trestle-Protocol" target="_blank" rel="noopener noreferrer">
              <Icon name="github" size={16} className="text-gray-400 hover:text-gray-600" />
            </a>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent("https://trestle.website")}&color=059669&bgcolor=ffffff&ecc=M`}
              alt="QR"
              className="rounded w-8 h-8"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}