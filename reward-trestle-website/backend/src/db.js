import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/rewards.db";

export function initDB() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
     CREATE TABLE IF NOT EXISTS config (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL
     );

     CREATE TABLE IF NOT EXISTS tasks (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       title TEXT NOT NULL,
       desc TEXT NOT NULL DEFAULT '',
       reward TEXT NOT NULL DEFAULT '10',
       type TEXT NOT NULL DEFAULT 'basic',
       active INTEGER NOT NULL DEFAULT 1,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     );

     CREATE TABLE IF NOT EXISTS tiers (
       rank INTEGER PRIMARY KEY,
       max_users INTEGER NOT NULL DEFAULT 1000,
       multiplier REAL NOT NULL DEFAULT 1.0,
       label TEXT NOT NULL DEFAULT ''
     );

     CREATE TABLE IF NOT EXISTS source_bonuses (
       source TEXT PRIMARY KEY,
       bonus REAL NOT NULL DEFAULT 1.0,
       label TEXT NOT NULL DEFAULT ''
     );

     CREATE TABLE IF NOT EXISTS users (
       address TEXT PRIMARY KEY,
       source TEXT NOT NULL DEFAULT '',
       streak INTEGER NOT NULL DEFAULT 0,
       last_checkin TEXT,
       total_earned TEXT NOT NULL DEFAULT '0',
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     );

     CREATE TABLE IF NOT EXISTS completed_tasks (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_address TEXT NOT NULL REFERENCES users(address),
       task_id INTEGER NOT NULL REFERENCES tasks(id),
       completed_at TEXT NOT NULL DEFAULT (datetime('now')),
       completed_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now')),
       UNIQUE(user_address, task_id, completed_date)
     );

     CREATE TABLE IF NOT EXISTS claims (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_address TEXT NOT NULL REFERENCES users(address),
       amount TEXT NOT NULL,
       claim_id TEXT NOT NULL UNIQUE,
       created_at TEXT NOT NULL DEFAULT (datetime('now'))
     );
   `);

  seedDefaults(db);
  return db;
}

function seedDefaults(db) {
  const tierCount = db.prepare("SELECT COUNT(*) as c FROM tiers").get().c;
  if (tierCount === 0) {
    const ins = db.prepare("INSERT INTO tiers (rank, max_users, multiplier, label) VALUES (?, ?, ?, ?)");
    ins.run(1, 1000, 2.0, "Genesis");
    ins.run(2, 1000, 1.9, "Early");
    ins.run(3, 1000, 1.8, "Supporter");
    ins.run(4, 1000, 1.7, "Builder");
    ins.run(5, 1000, 1.6, "Contributor");
  }

  const bonusCount = db.prepare("SELECT COUNT(*) as c FROM source_bonuses").get().c;
  if (bonusCount === 0) {
    const ins = db.prepare("INSERT INTO source_bonuses (source, bonus, label) VALUES (?, ?, ?)");
    ins.run("discord", 1.1, "Discord");
    ins.run("telegram", 1.1, "Telegram");
    ins.run("discord", 1.1, "Discord");
    ins.run("forum", 1.15, "Forum");
    ins.run("friend", 1.2, "Referral");
  }

  const taskCount = db.prepare("SELECT COUNT(*) as c FROM tasks").get().c;
  if (taskCount === 0) {
    const ins = db.prepare("INSERT INTO tasks (title, desc, reward, type) VALUES (?, ?, ?, ?)");
    ins.run("Daily Check-In", "Check in daily to maintain your streak", "10", "daily");
    ins.run("Follow on Twitter", "Follow @trestleprotocol and retweet", "25", "basic");
    ins.run("Join Telegram", "Join the Trestle community group", "25", "basic");
    ins.run("Link Your Wallet", "Connect your wallet to your profile", "15", "basic");
    ins.run("Complete Biometric Verification", "Submit biometric proof", "50", "mod");
    ins.run("Refer a Friend", "Share your referral link", "20", "mod");
    ins.run("Stake 100 LP Tokens", "Deposit LP tokens for 7 days", "100", "advanced");
    ins.run("Post About Trestle", "Share your experience on social media", "30", "mod");
    ins.run("Link Discord Account", "Connect your Discord for bonus rewards", "15", "basic");
    ins.run("Engage on Forum", "Post or reply on the community forum", "20", "mod");
  }

  const configCount = db.prepare("SELECT COUNT(*) as c FROM config").get().c;
  if (configCount === 0) {
    const ins = db.prepare("INSERT INTO config (key, value) VALUES (?, ?)");
    ins.run("claim_window_start", "0");
    ins.run("claim_interval", "1209600");
    ins.run("verifier_key", "");
  }
}
