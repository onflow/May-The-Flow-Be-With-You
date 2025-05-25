# Flow Rock Paper Scissors Game 🎮

A decentralized Rock Paper Scissors game built on the Flow blockchain where players can compete against a computer opponent.

## Features

- Connect with Flow wallet
- Play Rock Paper Scissors against computer
- Game results stored on Flow blockchain
- Beautiful, responsive UI with animations
- Real-time game outcome display

## Prerequisites

- Node.js (v14 or higher)
- Flow CLI
- Flow wallet (Blocto recommended)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Deploy the contract to Flow testnet:
```bash
flow project deploy --network testnet
```

3. Update the contract address in `src/App.js`:
Replace `0xYourContractAddress` with your deployed contract address.

4. Start the development server:
```bash
npm start
```

## How to Play

1. Connect your Flow wallet using the "Connect Wallet" button
2. Choose your move (Rock 🪨, Paper 📄, or Scissors ✂️)
3. Wait for the transaction to be processed
4. See the result of your game!

## Smart Contract

The game logic is implemented in Cadence and stored on the Flow blockchain. The contract includes:

- Move tracking (Rock, Paper, Scissors)
- Game outcome determination
- Player history storage
- Immutable game results

## Development

To run the project locally:

1. Start Flow emulator:
```bash
flow emulator start
```

2. Deploy contracts to emulator:
```bash
flow project deploy --network emulator
```

3. Start the development server:
```bash
npm start
```