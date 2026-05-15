# Trestle DeFi Monorepo

![Trestle Logo](https://via.placeholder.com/150) <!-- Replace with your logo -->

**A decentralized marketplace for digital assets, freelancer services, and real-world assets (RWA).**

This monorepo contains all projects related to the **Trestle Protocol**, including:
- The main website (`trestle.website`).
- Testnet website (`testnet.trestle.website`).
- Reward platform (`reward.trestle.website`).
- Telegram Mini-App.

---

## 📁 Directory Structure

```
trestle/
├── .gitignore                  # Global Git ignore rules
├── README.md                   # This file
├── package.json                # Workspace configuration
├── turbo.json                  # (Optional) Turborepo configuration
├── apps/                       # All applications
│   ├── main/                   # trestle.website (Next.js)
│   ├── testnet/                # testnet.trestle.website (Next.js)
│   ├── reward/                 # reward.trestle.website
│   │   ├── frontend/           # Frontend (Next.js)
│   │   └── backend/            # Backend (Node.js/Express)
│   └── mini-app/               # Telegram Mini-App (Next.js/React)
└── packages/                   # Shared code
    ├── ui/                     # Shared UI components
    └── utils/                  # Shared utilities
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended).
- **npm** or **Yarn** (v1.22+).
- **Git**.

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Trestle-Protocol/trestle.git
   cd trestle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` in each project (e.g., `apps/main/.env`).
   - Fill in the required values (e.g., API keys, RPC URLs).

---

## 🛠 Development

### Run All Projects
```bash
npm run dev
# or
yarn dev
```

### Run a Specific Project
```bash
cd apps/main
npm run dev
# or
yarn dev
```

---

## 🌐 Deployment

### `trestle.website` (Vercel)
1. Push code to the `main` branch.
2. Vercel will automatically deploy.
3. Configure environment variables in Vercel.

### `testnet.trestle.website` (Cloudflare Pages)
1. Push code to the `main` branch.
2. Cloudflare Pages will automatically deploy.
3. Configure environment variables in Cloudflare Pages.

### `reward.trestle.website` (Frontend: Netlify, Backend: Railway/Fly.io)
1. **Frontend**:
   - Push code to the `main` branch.
   - Netlify will automatically deploy.
   - Configure environment variables in Netlify.
2. **Backend**:
   - Push code to the `main` branch.
   - Railway/Fly.io will automatically deploy.
   - Configure environment variables in Railway/Fly.io.

### Telegram Mini-App (Vercel or Cloudflare Pages)
1. Push code to the `main` branch.
2. Vercel/Cloudflare Pages will automatically deploy.
3. Configure environment variables in the hosting provider.

---

## 🤝 Contributing

### Branch Strategy
- `main`: Production-ready code.
- `develop`: Staging area for features.
- `feature/`: Feature branches (e.g., `feature/add-login`).
- `release/`: Release branches (e.g., `release/v1.0.0`).
- `hotfix/`: Hotfix branches (e.g., `hotfix/fix-login-bug`).

### Pull Requests
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat: Add your feature"
   ```
3. Push to the remote:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a **Pull Request** to `develop`.

---

## 📜 License
This project is licensed under the **MIT License**.

---

## 📬 Contact
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-Protocol)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.m/TrestlePro)
- **Email**: contact@trestle.website
```

---

