import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTelegram } from "./hooks/useTelegram";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Tier1Staking from "./pages/Tier1Staking";
import Tier2Staking from "./pages/Tier2Staking";
import Tier3Vault from "./pages/Tier3Vault";
import Withdraw from "./pages/Withdraw";
import TreMindChat from "./components/TreMindChat";
import { useWalletSign } from "./components/QRCode";

export default function App() {
  const { ready, expand } = useTelegram();

  useEffect(() => {
    ready();
    expand();
  }, []);

  useWalletSign();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/stake/tier1" element={<Tier1Staking />} />
          <Route path="/stake/tier2" element={<Tier2Staking />} />
          <Route path="/stake/tier3" element={<Tier3Vault />} />
          <Route path="/withdraw" element={<Withdraw />} />
        </Route>
      </Routes>
      <TreMindChat />
    </BrowserRouter>
  );
}