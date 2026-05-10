import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface LeaderEntry {
  rank: number;
  address: string;
  score: number;
  streak: number;
  source: string;
  tasksDone: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<LeaderEntry[]>("/api/leaderboard")
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
        <p className="text-sm opacity-80">Weekly Mindshare Leaderboard</p>
        <p className="text-xs opacity-60 mt-1">Updated every Monday 00:00 UTC</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading leaderboard...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
            <span className="col-span-1">#</span>
            <span className="col-span-4">User</span>
            <span className="col-span-3 text-right">Score</span>
            <span className="col-span-2 text-right">Streak</span>
            <span className="col-span-2 text-right">Tasks</span>
          </div>
          {entries.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No entries yet</div>
          ) : (
            entries.map(e => (
              <div key={e.rank} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-gray-100 text-sm">
                <span className="col-span-1 font-semibold text-gray-400">
                  {e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}
                </span>
                <span className="col-span-4 text-gray-700 truncate">{e.address}</span>
                <span className="col-span-3 text-right font-medium text-emerald-600">{e.score}</span>
                <span className="col-span-2 text-right text-gray-500">{e.streak}d</span>
                <span className="col-span-2 text-right text-amber-600 font-medium">{e.tasksDone}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-amber-800">Mindshare Score</h3>
        <p className="text-xs text-amber-700 mt-1">
          Earn points: tasks, daily check-ins, referrals, social engagement, streaks.
          Top users get bonus multipliers.
        </p>
      </div>
    </div>
  );
}
