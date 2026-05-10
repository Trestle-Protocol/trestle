import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { initDB } from "./db.js";
import { initSigner, getSignerAddress, signClaim } from "./signer.js";
import { computeReward } from "./compute.js";

const app = express();
app.use(cors());
app.use(express.json());

const db = initDB();
initSigner();
const PORT = process.env.PORT || 3001;

function getConfig(key) { const r = db.prepare("SELECT value FROM config WHERE key = ?").get(key); return r ? r.value : null; }
function setConfig(key, value) { db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, value); }

// ─── TASKS ───
app.get("/api/tasks", (req, res) => {
  res.json(db.prepare("SELECT * FROM tasks ORDER BY id").all().map(t => ({ ...t, active: !!t.active })));
});
app.post("/api/tasks", (req, res) => {
  const { title, desc, reward, type } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const r = db.prepare("INSERT INTO tasks (title, desc, reward, type) VALUES (?, ?, ?, ?)")
    .run(title, desc || "", reward || "10", type || "basic");
  res.json({ id: r.lastInsertRowid });
});
app.put("/api/tasks/:id", (req, res) => {
  const { title, desc, reward, type, active } = req.body;
  db.prepare("UPDATE tasks SET title=?, desc=?, reward=?, type=?, active=? WHERE id=?")
    .run(title, desc, reward, type, active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});
app.delete("/api/tasks/:id", (req, res) => {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ─── TIERS ───
app.get("/api/tiers", (req, res) => res.json(db.prepare("SELECT * FROM tiers ORDER BY rank").all()));
app.put("/api/tiers", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "expected array" });
  db.transaction(() => {
    db.prepare("DELETE FROM tiers").run();
    const ins = db.prepare("INSERT INTO tiers (rank, max_users, multiplier, label) VALUES (?, ?, ?, ?)");
    for (const t of req.body) ins.run(t.rank, t.max_users, t.multiplier, t.label);
  })();
  res.json({ ok: true });
});

// ─── SOURCE BONUSES ───
app.get("/api/source-bonuses", (req, res) => res.json(db.prepare("SELECT * FROM source_bonuses ORDER BY source").all()));
app.put("/api/source-bonuses", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "expected array" });
  db.transaction(() => {
    db.prepare("DELETE FROM source_bonuses").run();
    const ins = db.prepare("INSERT INTO source_bonuses (source, bonus, label) VALUES (?, ?, ?)");
    for (const b of req.body) ins.run(b.source, b.bonus, b.label);
  })();
  res.json({ ok: true });
});

// ─── CONFIG ───
app.get("/api/config", (req, res) => {
  const rows = db.prepare("SELECT * FROM config").all();
  const c = {}; for (const r of rows) c[r.key] = r.value;
  c.verifier_address = getSignerAddress();
  res.json(c);
});
app.put("/api/config", (req, res) => {
  for (const [k, v] of Object.entries(req.body)) if (typeof v === "string") setConfig(k, v);
  res.json({ ok: true });
});

// ─── USERS ───
app.get("/api/users", (req, res) => {
  res.json(db.prepare(`SELECT u.*,
    (SELECT COUNT(*) FROM completed_tasks ct WHERE ct.user_address = u.address) as tasks_done,
    (SELECT COUNT(*) FROM claims cl WHERE cl.user_address = u.address) as claims_made
    FROM users u ORDER BY u.created_at DESC`).all());
});
app.get("/api/users/:address", (req, res) => {
  let u = db.prepare("SELECT * FROM users WHERE address = ?").get(req.params.address) ||
    { address: req.params.address, source: "", streak: 0, last_checkin: null, total_earned: "0" };
  u.completed = db.prepare(`SELECT ct.*, t.title, t.reward, t.type FROM completed_tasks ct
    JOIN tasks t ON t.id = ct.task_id WHERE ct.user_address = ? ORDER BY ct.completed_at DESC`).all(req.params.address);
  u.pendingReward = computeReward(db, req.params.address);
  res.json(u);
});
app.post("/api/users/:address/source", (req, res) => {
  const { source } = req.body;
  db.prepare("INSERT OR IGNORE INTO users (address) VALUES (?)").run(req.params.address);
  db.prepare("UPDATE users SET source = ? WHERE address = ?").run(source || "", req.params.address);
  res.json({ ok: true });
});

// ─── CHECK-IN ───
app.post("/api/users/:address/checkin", (req, res) => {
  const addr = req.params.address;
  db.prepare("INSERT OR IGNORE INTO users (address) VALUES (?)").run(addr);
  const user = db.prepare("SELECT * FROM users WHERE address = ?").get(addr);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (user.last_checkin?.slice(0, 10) === today) return res.json({ ok: true, streak: user.streak, alreadyCheckedIn: true });
  const newStreak = user.last_checkin?.slice(0, 10) === yesterday ? user.streak + 1 : 1;
  db.prepare("UPDATE users SET streak = ?, last_checkin = datetime('now') WHERE address = ?").run(newStreak, addr);
  res.json({ ok: true, streak: newStreak });
});

// ─── COMPLETE TASK ───
app.post("/api/users/:address/complete-task", (req, res) => {
  const { taskId } = req.body;
  if (!taskId) return res.status(400).json({ error: "taskId required" });
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND active = 1").get(taskId);
  if (!task) return res.status(404).json({ error: "task not found or inactive" });
  db.prepare("INSERT OR IGNORE INTO users (address) VALUES (?)").run(req.params.address);
  try {
    db.prepare("INSERT INTO completed_tasks (user_address, task_id) VALUES (?, ?)").run(req.params.address, taskId);
    res.json({ ok: true, reward: task.reward });
  } catch { res.status(409).json({ error: "already completed today" }); }
});

// ─── CLAIM ───
app.post("/api/users/:address/claim", async (req, res) => {
  try {
    const addr = req.params.address;
    const reward = computeReward(db, addr);
    if (reward.total === "0") return res.status(400).json({ error: "nothing to claim" });
    const claimId = "0x" + crypto.randomBytes(32).toString("hex");
    const signature = await signClaim(addr, reward.total, claimId);
    db.prepare("INSERT OR IGNORE INTO users (address) VALUES (?)").run(addr);
    db.prepare("INSERT INTO claims (user_address, amount, claim_id) VALUES (?, ?, ?)").run(addr, reward.total, claimId);
    db.prepare("UPDATE users SET total_earned = CAST(CAST(total_earned AS INTEGER) + ? AS TEXT), streak = 0, last_checkin = NULL WHERE address = ?")
      .run(reward.total, addr);
    db.prepare("DELETE FROM completed_tasks WHERE user_address = ?").run(addr);
    res.json({ claimId, amount: reward.total, signature, breakdown: reward });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ─── LEADERBOARD ───
app.get("/api/leaderboard", (req, res) => {
  const users = db.prepare(`SELECT address, streak, source, total_earned,
    (SELECT COUNT(*) FROM completed_tasks ct WHERE ct.user_address = u.address) as tasks_done
    FROM users u ORDER BY CAST(total_earned AS INTEGER) DESC LIMIT 50`).all();
  res.json(users.map((u, i) => ({
    rank: i + 1, address: u.address.slice(0, 6) + "..." + u.address.slice(-4),
    score: parseInt(u.total_earned) / 1e18, streak: u.streak, source: u.source, tasksDone: u.tasks_done,
  })));
});

// ─── STATS ───
app.get("/api/stats", (req, res) => res.json({
  totalUsers: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
  totalClaims: db.prepare("SELECT COUNT(*) as c FROM claims").get().c,
  totalEarned: db.prepare("SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as s FROM claims").get().s,
  activeTasks: db.prepare("SELECT COUNT(*) as c FROM tasks WHERE active = 1").get().c,
  todayCheckins: db.prepare("SELECT COUNT(*) as c FROM users WHERE date(last_checkin) = date('now')").get().c,
}));

// ─── TREMIND AI ───
import { resolveDispute, suggestEvidence } from "./treMind/dispute.js";
import { recommendTasks, detectAnomaly } from "./treMind/rewards.js";
import { analyzeListing, chat } from "./treMind/marketplace.js";

app.post("/api/treMind/dispute/resolve", async (req, res) => {
  try { res.json(await resolveDispute(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treMind/dispute/evidence", async (req, res) => {
  try { res.json(await suggestEvidence(req.body.claim)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treMind/rewards/recommend", async (req, res) => {
  try { res.json(await recommendTasks(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treMind/rewards/anomaly", async (req, res) => {
  try { res.json(await detectAnomaly(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treMind/marketplace/analyze", async (req, res) => {
  try { res.json(await analyzeListing(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/treMind/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    res.json({ response: await chat(message, context) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`Reward backend running on http://localhost:${PORT}`);
  if (getSignerAddress()) console.log(`Signer: ${getSignerAddress()}`);
  console.log("TreMind AI endpoints active at /api/treMind/*");
});
