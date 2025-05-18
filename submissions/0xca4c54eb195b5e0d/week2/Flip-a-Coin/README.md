# Flow Coin Flip Game 🪙

A blockchain-based coin flip game built on Flow where users can flip a coin and have their results recorded on-chain.

## Features

- Connect with Flow wallet
- Flip a coin with one click
- View flip results (Heads/Tails)
- Track statistics (total flips, wins, streaks)
- Beautiful, responsive UI
- Blockchain-based randomness

## Prerequisites

- Node.js (v14 or later)
- Flow CLI
- Flow emulator (for local development)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the Flow emulator:
```bash
flow emulator start
```

3. Deploy the contract:
```bash
flow project deploy --network emulator
```

4. Start the development server:
```bash
npm start
```

## Usage

1. Connect your Flow wallet using the "Connect Wallet" button
2. Click "Flip Coin" to make a flip
3. View your result and statistics
4. Disconnect wallet when done

## Smart Contract

The game uses a Cadence smart contract (`CoinFlip.cdc`) that:
- Generates random flip results
- Tracks player statistics
- Emits events for each flip
- Maintains player history

## Development

- `src/App.js` - Main React component
- `src/config/fcl.js` - Flow Client Library configuration
- `cadence/contracts/CoinFlip.cdc` - Smart contract

## Security Note

The current implementation uses a pseudo-random number generator. For production use, consider implementing a Verifiable Random Function (VRF) or oracle for true randomness.

## License

MIT 