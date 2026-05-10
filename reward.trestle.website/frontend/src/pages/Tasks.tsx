import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContracts } from "../hooks/useContracts";
import { api } from "../lib/api";

interface TaskDef {
  id: number;
  title: string;
  desc: string;
  reward: string;
  type: string;
  active: boolean;
}

export default function Tasks() {
  const { address } = useActiveAccount();
  const { isConnected, isEligible } = useContracts();
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loadingTask, setLoadingTask] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api<TaskDef[]>("/api/tasks").then(t => setTasks(t.filter(x => x.active))).catch(console.error);
  }, []);

  useEffect(() => {
    if (!address) return;
    api<{ completed: { task_id: number }[] }>(`/api/users/${address}`)
      .then(u => {
        setCompletedIds(u.completed.map(c => c.task_id));
      })
      .catch(console.error);
  }, [address]);

  if (!isConnected) return <div className="text-center py-12 text-gray-500"><p>Sign in to see tasks</p></div>;

  if (!isEligible) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-2">Verify your identity first</p>
        <a href="/verify" className="text-emerald-600 underline text-sm">Go to verification</a>
      </div>
    );
  }

  const handleComplete = async (taskId: number) => {
    setLoadingTask(taskId);
    try {
      if (taskId === 1) {
        await api(`/api/users/${address}/checkin`, { method: "POST" });
      }
      await api(`/api/users/${address}/complete-task`, {
        method: "POST",
        body: JSON.stringify({ taskId }),
      });
      setCompletedIds(prev => [...prev, taskId]);
    } catch (e: any) {
      if (e.message !== "already completed today") alert(e.message);
    }
    setLoadingTask(null);
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "daily", "basic", "mod", "advanced"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              filter === f ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {f === "all" ? "All" : f === "mod" ? "Standard" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.map(task => {
        const done = completedIds.includes(task.id);
        return (
          <div
            key={task.id}
            className={`bg-white rounded-xl p-4 border transition ${
              done ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={done}
                disabled={done || loadingTask === task.id}
                onChange={() => handleComplete(task.id)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
              />
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${done ? "line-through text-gray-400" : ""}`}>
                  {task.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{task.desc}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{task.reward} hNOBT</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
