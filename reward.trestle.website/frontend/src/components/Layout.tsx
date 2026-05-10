import { Outlet, NavLink } from "react-router-dom";
import { ConnectButton } from "thirdweb/react";
import { client, chain, wallets } from "../config/web3";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <NavLink to="/" className="text-xl font-bold text-emerald-600">Trestle</NavLink>
          <ConnectButton
            client={client}
            chain={chain}
            wallets={wallets}
            theme="light"
            connectButton={{ className: "!text-xs !py-1 !px-3 !h-auto !min-h-0 !rounded-lg" }}
          />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto">
        <div className="flex justify-around py-2">
          {[
            { to: "/", label: "Home", end: true },
            { to: "/tasks", label: "Tasks" },
            { to: "/verify", label: "Verify" },
            { to: "/claim", label: "Claim" },
            { to: "/leaderboard", label: "Top" },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${isActive ? "text-emerald-600 font-semibold" : "text-gray-500"}`
              }
            >
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
