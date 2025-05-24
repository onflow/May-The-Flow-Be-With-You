# Flow Game

A full-stack blockchain game built on the Flow testnet. Players can create profiles, collect unique items, and trade them in a decentralized marketplace. The project uses Cadence smart contracts and a modern React + Chakra UI frontend.

---

## 🚀 Features
- **Flow Blockchain Integration**: All game logic and assets are managed on-chain using Cadence smart contracts.
- **User Profiles**: Players create and manage their own blockchain-based profiles.
- **Game Items**: Mint, collect, and manage unique in-game items.
- **Marketplace**: List, buy, and sell items with other players in a decentralized market.
- **Modern UI**: Beautiful, responsive frontend built with React and Chakra UI.

---

## 🏗️ Project Structure

```
flow-game/
├── cadence/                # Cadence smart contracts
│   └── contracts/
│       ├── GameItems.cdc
│       ├── GameProfile.cdc
│       └── GameMarket.cdc
├── web/                    # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── Profile.tsx
│   │       └── Market.tsx
│   └── ...
├── flow.json               # Flow project config
├── package.json            # Root project config
└── README.md               # This file
```

---

## ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Flow CLI](https://docs.onflow.org/flow-cli/install/)
- [npm](https://www.npmjs.com/)

---

## 🔐 Flow Testnet Account
You need a Flow testnet account with a private key. You can generate one using:

1. `flow keys generate` (save the private key!)
2. Go to [https://testnet-faucet.onflow.org/](https://testnet-faucet.onflow.org/) and create an account with your public key.
3. Update `flow.json` with your new address and private key.

---

## 🛠️ Setup & Installation

### 1. Clone the repository
```sh
git clone this project
cd FlowVerse
```

### 2. Install dependencies
```sh
npm install
cd web
npm install
```

### 3. Deploy contracts to Flow testnet
```sh
cd ..
flow project deploy --network testnet
```

---

## 🖥️ Running the Frontend

### 1. Start the frontend dev server
```sh
cd web
npm run dev
```

### 2. Open your browser
Go to [http://localhost:5173](http://localhost:5173)

---

## 🔗 Contract Addresses
All contracts are deployed to:
```
0x5654a1db2e6c9f07
```
Update this address in your frontend code if you redeploy.

---

## 🧩 Architecture
- **Cadence Contracts**: Define game logic, items, profiles, and market.
- **React Frontend**: Handles wallet authentication, profile management, item minting, and marketplace UI.
- **Chakra UI**: For beautiful, responsive design.
- **@onflow/fcl**: For Flow blockchain interaction.

---

## 📝 Customization
- To add new item types, update `GameItems.cdc` and the frontend item creation logic.
- To add new game features, extend the contracts and UI as needed.

---

## 🐞 Troubleshooting
- **Profile creation fails**: Ensure contracts are deployed and addresses are correct in the frontend.
- **Transaction errors**: Check your Flow account has enough testnet FLOW and the correct private key in `flow.json`.
- **Contract redeployment**: You must use a new testnet account to redeploy contracts on testnet.

---

## 🤝 Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes first.

---

## 📄 License
MIT 