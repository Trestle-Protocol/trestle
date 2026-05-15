import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Verify from "./pages/Verify";
import Claim from "./pages/Claim";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
// import TreMindChat from "./components/TreMindChat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/claim" element={<Claim />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
      {/* <TreMindChat /> */}
    </BrowserRouter>
  );
}
