# Flow Smart Contract Documentation Assistant

A full-stack decentralized application (dApp) on the Flow blockchain to simplify the understanding and management of Flow smart contracts for non-technical users. The app provides explanations, risk assessments, and highlights important terms related to DeFi and NFTs.

Live Link (https://flow-snap-panditdhamdheres-projects.vercel.app/)

## Features
- Connect your Flow wallet (testnet)
- Add and query smart contract documentation
- Risk assessment and description for each contract
- Beautiful, modern UI with Material UI

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- Flow CLI

### Installation
```bash
npm install
```

### Flow Setup
1. Start the Flow emulator (for local dev) or use testnet.
2. Deploy the contract:
   ```bash
   flow deploy --network testnet
   ```
3. Fund your testnet account if needed: https://testnet-faucet.onflow.org/

### Running the Frontend
```bash
npm start
```

### Project Structure
- `cadence/` - Cadence smart contracts, scripts, and transactions
- `src/` - React frontend (TypeScript, Material UI)
- `public/` - Static assets and `index.html`
- `flow.json` - Flow project configuration

### Security
- **Never commit your private key files (`*.pkey`) or `.env` files.**
- Sensitive files are included in `.gitignore` by default.

## License
MIT 