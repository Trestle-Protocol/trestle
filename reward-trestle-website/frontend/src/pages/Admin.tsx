import { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";

interface TaskDef {
  id: number;
  title: string;
  desc: string;
  reward: string;
  type: "daily" | "basic" | "mod" | "advanced";
  active: boolean;
}

interface Tier {
  rank: number;
  max_users: number;
  multiplier: number;
  label: string;
}

interface SourceBonus {
  source: string;
  bonus: number;
  label: string;
}

const TYPES = [
  { id: "daily", label: "Daily", color: "bg-blue-100 text-blue-700" },
  { id: "basic", label: "Basic", color: "bg-green-100 text-green-700" },
  { id: "mod", label: "Standard", color: "bg-amber-100 text-amber-700" },
  { id: "advanced", label: "Advanced", color: "bg-purple-100 text-purple-700" },
];

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Admin() {
  const { address } = useActiveAccount();
  const { isConnected, isOwner, owner, claimWindowStart, claimInterval, writeContract, rewardDistributor } = useContracts();
  const [tab, setTab] = useState("tasks");

  // Contract controls
  const [startDate, setStartDate] = useState(() => toDatetimeLocal(new Date(Date.now() + 30 * 86400000)));
  const [intervalDays, setIntervalDays] = useState("14");
  const [verifierAddr, setVerifierAddr] = useState("");
  const [fundAmount, setFundAmount] = useState("");

  // Server state
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [bonuses, setBonuses] = useState<SourceBonus[]>([]);
  const [loading, setLoading] = useState(true);

  // Task editor
  const [editingTask, setEditingTask] = useState<Partial<TaskDef> | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, ti, b] = await Promise.all([
        api("/api/tasks"),
        api("/api/tiers"),
        api("/api/source-bonuses"),
      ]);
      setTasks(t);
      setTiers(ti);
      setBonuses(b);
    } catch (e) { console.error("Failed to load admin data", e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (isOwner) reload(); }, [isOwner, reload]);

  const saveTask = async () => {
    if (!editingTask?.title) return;
    try {
      if (editingTask.id) {
        await api(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          body: JSON.stringify({ title: editingTask.title, desc: editingTask.desc, reward: editingTask.reward, type: editingTask.type, active: editingTask.active ?? true }),
        });
      } else {
        await api("/api/tasks", {
          method: "POST",
          body: JSON.stringify({ title: editingTask.title, desc: editingTask.desc, reward: editingTask.reward, type: editingTask.type }),
        });
      }
      setEditingTask(null);
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  const toggleTask = async (task: TaskDef) => {
    try {
      await api(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...task, active: !task.active }),
      });
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  const deleteTask = async (id: number) => {
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  const saveTiers = async () => {
    try {
      await api("/api/tiers", {
        method: "PUT",
        body: JSON.stringify(tiers),
      });
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  const saveBonuses = async () => {
    try {
      await api("/api/source-bonuses", {
        method: "PUT",
        body: JSON.stringify(bonuses),
      });
      await reload();
    } catch (e: any) { alert(e.message); }
  };

  if (!isConnected) return <div className="text-center py-12 text-gray-500"><p>Sign in as owner</p></div>;

  if (!isOwner) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-2xl">🔒</p>
        <h2 className="text-lg font-semibold text-red-800 mt-2">Access Denied</h2>
        <p className="text-xs text-red-500 mt-2">Owner: {owner?.slice(0, 6)}...{owner?.slice(-4)}</p>
      </div>
    );
  }

  const handleSetWindow = async () => {
    const ts = Math.floor(new Date(startDate).getTime() / 1000);
    const interval = Number(intervalDays) * 86400;
    try {
      await api("/api/config", { method: "PUT", body: JSON.stringify({ claim_window_start: String(ts), claim_interval: String(interval) }) });
      if (rewardDistributor && writeContract) {
        const { toWei } = await import("thirdweb");
        alert("Window updated in DB. Call contract setClaimWindow from owner wallet when ready.");
      } else {
        alert("Window saved to backend config. Connect wallet to update contract on-chain.");
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleSetVerifier = async () => {
    try {
      await api("/api/config", { method: "PUT", body: JSON.stringify({ verifier_address: verifierAddr }) });
      if (rewardDistributor && writeContract) {
        const { prepareContractCall } = await import("thirdweb");
        const tx = prepareContractCall({ contract: rewardDistributor, method: "setVerifier", params: [verifierAddr] });
        await writeContract(tx);
      }
      alert("Verifier updated on backend" + (rewardDistributor ? " and contract" : ""));
    } catch (e: any) { alert(e.message); }
  };

  const handleFund = async () => {
    if (!fundAmount || !rewardDistributor || !writeContract) return;
    try {
      const { prepareContractCall } = await import("thirdweb");
      const tx = prepareContractCall({ contract: rewardDistributor, method: "fund", params: [fundAmount] });
      await writeContract(tx);
      alert("Funded!");
    } catch (e: any) { alert(e.message); }
  };

  const TABS = [
    { id: "tasks", label: "Tasks" },
    { id: "tiers", label: "Multipliers" },
    { id: "sources", label: "Source Bonuses" },
    { id: "window", label: "Claim Window" },
    { id: "verifier", label: "Verifier" },
    { id: "fund", label: "Fund" },
  ];

  const renderTaskForm = () => (
    <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-3">
      <div>
        <label className="text-xs text-gray-600 block mb-1">Title</label>
        <input value={editingTask?.title ?? ""} onChange={e => setEditingTask(p => ({ ...p, title: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Task name" />
      </div>
      <div>
        <label className="text-xs text-gray-600 block mb-1">Description</label>
        <input value={editingTask?.desc ?? ""} onChange={e => setEditingTask(p => ({ ...p, desc: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="What users need to do" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Reward (hNOBT)</label>
          <input value={editingTask?.reward ?? ""} onChange={e => setEditingTask(p => ({ ...p, reward: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="10" />
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">Type</label>
          <select value={editingTask?.type ?? "basic"} onChange={e => setEditingTask(p => ({ ...p, type: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={saveTask} className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition">
          {editingTask?.id ? "Update Task" : "Add Task"}
        </button>
        <button onClick={() => setEditingTask(null)} className="px-4 text-gray-500 text-sm hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading admin data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Admin Dashboard</h2>
          <p className="text-xs text-gray-500">Owner: {owner?.slice(0, 6)}...{owner?.slice(-4)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200 transition">
            Reload
          </button>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Live</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              tab === t.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TASKS ─── */}
      {tab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Task Definitions ({tasks.filter(t => t.active).length} active)</h3>
            <button onClick={() => setEditingTask({ title: "", desc: "", reward: "", type: "basic" })}
              className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600 transition">
              + New Task
            </button>
          </div>

          {editingTask && renderTaskForm()}

          {tasks.map(task => (
            <div key={task.id} className={`bg-white rounded-xl p-4 border transition ${task.active ? "border-gray-200" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold text-sm ${!task.active && "line-through text-gray-400"}`}>{task.title}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${TYPES.find(t => t.id === task.type)?.color}`}>{task.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{task.desc}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{task.reward} hNOBT</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleTask(task)}
                    className={`text-xs px-2 py-1 rounded ${task.active ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                    {task.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => setEditingTask(task)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                    Edit
                  </button>
                  <button onClick={() => deleteTask(task.id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TIERS ─── */}
      {tab === "tiers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Early Adopter Multiplier Tiers</h3>
            <button onClick={saveTiers} className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600 transition">
              Save Tiers
            </button>
          </div>
          <p className="text-xs text-gray-500">Multiplier decreases as more users join. Applied to all reward calculations off-chain.</p>
          {tiers.map((tier: Tier, i: number) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Label</label>
                  <input value={tier.label} onChange={e => {
                    const next = [...tiers]; next[i] = { ...next[i], label: e.target.value }; setTiers(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Max Users</label>
                  <input type="number" value={tier.max_users} onChange={e => {
                    const next = [...tiers]; next[i] = { ...next[i], max_users: Number(e.target.value) }; setTiers(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Multiplier (x)</label>
                  <input type="number" step="0.1" value={tier.multiplier} onChange={e => {
                    const next = [...tiers]; next[i] = { ...next[i], multiplier: Number(e.target.value) }; setTiers(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── SOURCE BONUSES ─── */}
      {tab === "sources" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Source-Based Reward Bonuses</h3>
            <button onClick={saveBonuses} className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-lg hover:bg-emerald-600 transition">
              Save Bonuses
            </button>
          </div>
          <p className="text-xs text-gray-500">Extra multiplier for users coming from specific channels.</p>
          {bonuses.map((b: SourceBonus, i: number) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Source ID</label>
                  <input value={b.source} onChange={e => {
                    const next = [...bonuses]; next[i] = { ...next[i], source: e.target.value }; setBonuses(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Label</label>
                  <input value={b.label} onChange={e => {
                    const next = [...bonuses]; next[i] = { ...next[i], label: e.target.value }; setBonuses(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bonus (x)</label>
                  <input type="number" step="0.05" value={b.bonus} onChange={e => {
                    const next = [...bonuses]; next[i] = { ...next[i], bonus: Number(e.target.value) }; setBonuses(next);
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CLAIM WINDOW ─── */}
      {tab === "window" && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          <h3 className="font-semibold text-sm">Claim Window</h3>
          <div className="text-xs text-gray-500">
            Current: {claimWindowStart ? new Date(claimWindowStart * 1000).toLocaleDateString() : "not set"}, interval={claimInterval ? `${claimInterval / 86400}d` : "not set"}
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Window Start</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Claim Interval (days)</label>
            <input type="number" value={intervalDays} onChange={e => setIntervalDays(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSetWindow} className="w-full bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition">
            Set Window
          </button>
        </div>
      )}

      {/* ─── VERIFIER ─── */}
      {tab === "verifier" && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          <h3 className="font-semibold text-sm">Verifier Key</h3>
          <p className="text-xs text-gray-500">Signs off-chain reward claims. Set to your backend's signing address.</p>
          <input type="text" value={verifierAddr} onChange={e => setVerifierAddr(e.target.value)}
            placeholder="0x..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={handleSetVerifier} disabled={!verifierAddr}
            className="w-full bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
            Update Verifier
          </button>
        </div>
      )}

      {/* ─── FUND ─── */}
      {tab === "fund" && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          <h3 className="font-semibold text-sm">Fund Rewards</h3>
          <p className="text-xs text-gray-500">Deposit hNOBT into the distributor. Users claim from this pool.</p>
          <input type="text" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
            placeholder="Amount in hNOBT" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleFund} disabled={!fundAmount}
            className="w-full bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
            Fund Rewards
          </button>
        </div>
      )}
    </div>
  );
}
