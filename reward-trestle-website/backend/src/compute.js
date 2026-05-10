export function computeReward(db, address) {
  const user = db.prepare("SELECT * FROM users WHERE address = ?").get(address);
  if (!user) return { total: "0", breakdown: [], multipliers: null };

  const completed = db.prepare(`
    SELECT ct.task_id, t.title, t.reward, t.type
    FROM completed_tasks ct JOIN tasks t ON t.id = ct.task_id
    WHERE ct.user_address = ?
  `).all(address);

  if (completed.length === 0) return { total: "0", breakdown: [], multipliers: null };

  let rawTotal = 0n;
  const breakdown = [];
  for (const c of completed) {
    const r = BigInt(c.reward) * 10n ** 18n;
    rawTotal += r;
    breakdown.push({ taskId: c.task_id, title: c.title, reward: c.reward, type: c.type });
  }

  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const tiers = db.prepare("SELECT * FROM tiers ORDER BY rank ASC").all();
  let tierMult = 1.0;
  let remaining = userCount;
  for (const t of tiers) {
    if (remaining <= t.max_users) { tierMult = t.multiplier; break; }
    remaining -= t.max_users;
  }

  let sourceMult = 1.0;
  if (user.source) {
    const b = db.prepare("SELECT bonus FROM source_bonuses WHERE source = ?").get(user.source);
    if (b) sourceMult = b.bonus;
  }

  const streakMult = 1.0 + Math.min(user.streak * 0.01, 0.5);
  const totalMult = tierMult * sourceMult * streakMult;
  const total = rawTotal * BigInt(Math.floor(totalMult * 100)) / 100n;

  return {
    total: total.toString(),
    breakdown,
    multipliers: { tier: tierMult, source: sourceMult, streak: streakMult, combined: totalMult },
  };
}
