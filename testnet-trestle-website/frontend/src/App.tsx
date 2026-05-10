import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Tier1Staking from "./pages/Tier1Staking";
import Tier2Staking from "./pages/Tier2Staking";
import Tier3Vault from "./pages/Tier3Vault";
import Withdraw from "./pages/Withdraw";

export default function App() {
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
    </BrowserRouter>
  );
}
