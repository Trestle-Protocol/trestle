# Reward Hub Backend

Express.js backend for the Trestle Protocol reward hub. Uses SQLite via better-sqlite3.

## Features

- Task CRUD and user tracking with streaks
- Check-in system
- Off-chain reward computation (tier × source × streak multipliers)
- Claim signing via ethers
- TreMind AI endpoints (dispute resolution, recommendations, chat, anomaly detection)
- Multi-RPC with automatic failover

## Commands

```bash
npm install
npm run dev    # nodemon, http://localhost:3001
npm start
```
