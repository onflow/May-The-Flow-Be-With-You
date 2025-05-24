# Flow Random Art Generator

A Flow-based dApp that generates random art using on-chain randomness and Cadence smart contracts.

## Features
- Connect your Flow wallet (testnet)
- Generate unique random art pieces on-chain
- View generated art with beautiful gradients

---

## Project Structure

```
randomness/
├── cadence/
│   ├── contracts/
│   │   └── RandomArt.cdc
│   ├── scripts/
│   │   └── get_art_piece.cdc
│   └── transactions/
│       └── generate_art.cdc
├── web/
│   ├── src/
│   │   ├── App.js
│   │   └── fclConfig.js
│   └── ...
├── flow.json
├── .gitignore
├── .env.example
└── README.md
```

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Flow CLI](https://docs.onflow.org/flow-cli/install/)

---

## Setup

1. **Clone the repository:**
   ```sh
   git clone this repo
   cd randomness
   ```

2. **Install dependencies:**
   ```sh
   cd web
   npm install
   ```

3. **Configure Flow testnet account:**
   - Copy `.env.example` to `.env` and fill in your Flow testnet address and private key.
   - Update `flow.json` with your testnet account (no `0x` prefix, all lowercase).

4. **Update FCL config for testnet:**
   - In `web/src/fclConfig.js`, ensure:
     ```js
     .put('accessNode.api', 'https://rest-testnet.onflow.org')
     .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')
     ```

---

## Deploy the Contract

1. **Check connectivity:**
   ```sh
   curl https://rest-testnet.onflow.org/health
   ```
   You should see `{ "ok": true }`.

2. **Deploy to Flow testnet:**
   ```sh
   flow deploy --network testnet
   ```
   If you see connection errors, try from a different network or check your firewall/VPN.

---

## Run the Frontend

1. **Start the React app:**
   ```sh
   cd web
   npm start
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage
- Click **Connect Wallet** and authenticate with your Flow testnet wallet.
- Click **Generate New Art** to mint a new random art piece.
- View your generated art and details on the page.

---

## Security
- **Never commit your real `.env` or private keys to GitHub.**
- Use `.env.example` for sharing config structure.

---

## License
MIT 