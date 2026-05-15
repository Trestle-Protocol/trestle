import { Outlet } from "react-router-dom";
import { useActiveAccount, useDisconnect } from "thirdweb/react";
import QRCode from "./QRCode";
import { LoadingSpinner } from "./LoadingSpinner";
import { Icon } from "./Icon";

export default function Layout() {
  const address = useActiveAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                <Icon name="logo" size={24} />
                Trestle Reward Hub
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {address && (
                <>
                  <button
                    onClick={() => {
                      const el = document.getElementById("qr-modal");
                      if (el) (el as HTMLElement).classList.remove("hidden");
                    }}
                    className="text-xs flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
                  >
                    <Icon name="telegram" size={14} />
                    Open
                  </button>
                  <button
                    onClick={() => disconnect()}
                    className="text-xs text-gray-500 hover:text-red-500 transition flex items-center gap-1"
                  >
                    <Icon name="check" size={14} />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
          {address && (
            <p className="text-[10px] text-gray-400 text-center mt-1">
              {typeof address === "string"
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Connected"}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <div className="flex justify-center gap-4 mb-2">
            <a href="https://discord.gg/4dCCvnJYGT" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-600 transition flex items-center gap-1">
              <Icon name="discord" size={14} /> Discord
            </a>
            <a href="https://t.m/TrestlePro" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-600 transition flex items-center gap-1">
              <Icon name="telegram" size={14} /> Telegram
            </a>
            <a href="mailto:contact@trestle.website" className="text-sm text-gray-500 hover:text-emerald-600 transition flex items-center gap-1">
              <Icon name="email" size={14} /> Contact
            </a>
          </div>
          <p className="text-[10px] text-gray-400">© {new Date().getFullYear()} Trestle Protocol</p>
        </div>
      </footer>

      {/* QR Modal */}
      <div id="qr-modal" className="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm items-center justify-center p-4"
           onClick={(e) => { if ((e.target as HTMLElement).id === "qr-modal") (e.target as HTMLElement).classList.add("hidden"); }}>
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center"
             onClick={(e) => e.stopPropagation()}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Open on Mobile</h3>
          <QRCode value={typeof window !== "undefined" ? window.location.href : "https://reward.trestle.website"} size={160} />
          <button
            onClick={() => {
              const el = document.getElementById("qr-modal");
              if (el) (el as HTMLElement).classList.add("hidden");
            }}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Close ✕
          </button>
        </div>
      </div>
    </div>
  );
}