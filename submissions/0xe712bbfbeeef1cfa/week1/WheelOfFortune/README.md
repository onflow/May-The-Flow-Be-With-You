# Wheel of Fortune

A decentralized Wheel of Fortune game built on the Flow blockchain. This project demonstrates the use of on-chain randomness for fair and transparent prize distribution.

## Features

- Interactive wheel spinning animation
- On-chain randomness for fair prize distribution
- Flow blockchain integration
- Modern and responsive UI
- Wallet connection support

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Flow CLI
- Flow wallet (e.g., Blocto, Dapper)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WheelOfMisfortune
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the smart contract:
```bash
flow deploy
```

## Usage

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Connect your Flow wallet

4. Click "Spin the Wheel" to play!

## Smart Contract

The game uses a smart contract deployed on the Flow blockchain to ensure fair and transparent prize distribution. The contract includes:

- Wheel segments with different prizes and weights
- On-chain randomness generation
- Event emission for tracking spins

## Development

### Project Structure

```
WheelOfMisfortune/
├── cadence/
│   ├── contracts/
│   │   └── WheelOfFortune.cdc
│   ├── scripts/
│   │   └── spin_wheel.cdc
│   └── transactions/
│       └── deploy_contract.cdc
├── src/
│   ├── config/
│   │   └── flow.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── README.md
```

### Building for Production

```bash
npm run build
```

