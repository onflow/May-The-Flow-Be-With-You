# FlowPersona

> Formerly known as "Flow Identity System"

A full-stack decentralized application (dApp) on the Flow blockchain for algorithmic identity, visual signatures, evolving avatars, and a visual reputation system.
Live Link : https://flowpersona.vercel.app/

---

## 🚀 Project Overview

**FlowPersona** enables users to create, manage, and visualize their on-chain identity on the Flow blockchain. Each user has a unique, evolving 3D avatar and a reputation score that grows with participation. The dApp is built with Next.js, React Three Fiber, Tailwind CSS, and Cadence smart contracts.

---

## ✨ Features

- **Flow Wallet Integration**: Secure authentication and transaction signing with Flow wallets (Blocto, Dapper, Ledger, etc.).
- **Resource-based Identity**: Each user owns a unique on-chain identity resource.
- **3D Avatar Visualization**: Dynamic avatars reflect reputation and participation.
- **Reputation System**: Earn reputation points for actions and see your progress visually.
- **Modern UI/UX**: Beautiful, responsive design with smooth animations and glassmorphism.
- **Real-time Updates**: See your identity and avatar evolve instantly after actions.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion, React Three Fiber, Drei
- **Smart Contracts**: Cadence (Flow blockchain)
- **Wallet Integration**: Flow Client Library (FCL)

---

## ⚡ Getting Started

### 1. Clone the Repository

```sh
git clone this repo
cd flow-identity-system
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Configure Flow

- Update `flow.json` with your Flow testnet account and contract addresses.
- Make sure your Flow account is funded (use the [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)).

### 4. Run the Development Server

```sh
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Deploy Smart Contract

- Deploy your Cadence contract to Flow testnet:

```sh
flow deploy --network=testnet
```

### 6. Deploy to Vercel

```sh
npx vercel --prod
```

---

## 🧑‍💻 Usage

- **Connect Wallet**: Click "Connect Wallet" to authenticate.
- **Create Identity**: If you don't have an identity, create one with a single click.
- **Earn Reputation**: Perform actions to increase your reputation and see your avatar evolve.
- **Visualize**: Enjoy your unique, animated 3D avatar and reputation stats.

---

## 📁 Project Structure

```
├── cadence/                # Cadence smart contracts & transactions
├── components/             # React components (Avatar, etc.)
├── pages/                  # Next.js pages (index.tsx, _app.tsx)
├── styles/                 # Tailwind CSS and global styles
├── lib/                    # FCL configuration and utilities
├── flow.json               # Flow project config
├── .gitignore              # Sensitive files ignored
├── README.md               # Project documentation
```

---

## 🔒 Security & Best Practices

- **Never commit private keys or secrets.**
- All sensitive files (`*.pkey`, `.env`, `flow.json`) are in `.gitignore`.
- Use environment variables for secrets in production (set in Vercel dashboard).
- Fund your Flow testnet account only via the official faucet.

---

## 📝 License

MIT

---

## 🙏 Acknowledgements

- [Flow Blockchain](https://www.onflow.org/)
- [Cadence Language](https://developers.flow.com/cadence)
- [Next.js](https://nextjs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 💬 Contributing & Support

Pull requests and issues are welcome! For questions, open an issue or reach out via the repository.
