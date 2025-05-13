# Click to Moon 🚀

A blockchain-based clicker game built on Flow blockchain where players click a rocket to generate thrust points and purchase upgrades.

## Features

- Click to generate thrust points
- Purchase boosters to increase points per click
- Buy auto-thrusters for passive income
- All progress stored on-chain using Flow blockchain
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js 14+ and npm
- Flow CLI (for contract deployment)
- A Flow wallet (like Blocto or Lilico)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/click-to-moon.git
cd click-to-moon
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the smart contract:
```bash
flow deploy
```

4. Update the contract address in `src/config.js` with your deployed contract address.

5. Start the development server:
```bash
npm start
```

## Smart Contract

The game's core logic is implemented in Cadence (Flow's smart contract language) and includes:

- Player resource for storing game state
- Thrust point generation
- Upgrade system (boosters and auto-thrusters)
- Event emission for tracking game progress

## Frontend

The React frontend uses:
- Flow Client Library (FCL) for blockchain interaction
- Tailwind CSS for styling
- Custom hooks for wallet integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
