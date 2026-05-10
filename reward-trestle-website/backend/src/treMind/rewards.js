import { askJSON } from "./provider.js";

const RECOMMEND_SYSTEM = `You are TreMind, the Trestle reward AI.
Analyze user activity and suggest personalized tasks.
Return JSON: { "recommendations": [{ "task": "name", "reason": "why this fits", "priority": 1-5 }] }`;

export async function recommendTasks(user) {
  const profile = {
    streak: user.streak || 0,
    source: user.source || "direct",
    completed: (user.completed || []).map(c => c.title || c.task_id),
    tasksDone: (user.tasks_done || 0),
    totalEarned: user.total_earned || "0",
  };
  const r = await askJSON(RECOMMEND_SYSTEM, JSON.stringify(profile));
  return r?.recommendations || [];
}

const ANOMALY_SYSTEM = `You are TreMind, monitoring Trestle rewards for suspicious activity.
Return JSON: { "suspicious": true/false, "riskScore": 0-1, "reason": "explanation" }`;

export async function detectAnomaly(user) {
  const profile = {
    address: user.address?.slice(0, 8),
    streak: user.streak || 0,
    source: user.source || "direct",
    completedCount: (user.completed || []).length,
    totalEarned: user.total_earned || "0",
  };
  return askJSON(ANOMALY_SYSTEM, JSON.stringify(profile));
}
