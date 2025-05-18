# ChainRaffle - Flow Blockchain Raffle System

A decentralized raffle system built on the Flow blockchain that allows users to create and participate in raffles with verifiable randomness.

## Features

- Create new raffles with customizable parameters
- Purchase raffle tickets
- Automatic winner selection using Flow's secure randomness
- Real-time updates of raffle status
- Integration with Flow wallet for secure transactions

## Prerequisites

- Node.js (v14 or higher)
- Flow CLI
- Flow testnet account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd chain-raffle
```

2. Install dependencies:
```bash
npm install
```

3. Update the Flow contract address:
In `src/App.js`, replace `0xChainRaffle` with your deployed contract address.

4. Start the development server:
```bash
npm start
```

## Smart Contract Deployment

1. Deploy the ChainRaffle contract to Flow testnet:
```bash
flow project deploy --network testnet
```

## Usage

1. Connect your Flow wallet using the "Log In" button
2. Create a new raffle by filling out the form:
   - Name: The title of your raffle
   - Ticket Price: Cost per ticket in FLOW tokens
   - Max Tickets: Maximum number of tickets available
   - Duration: How long the raffle will run (in seconds)
3. Purchase tickets for active raffles
4. Once a raffle ends, anyone can trigger the winner selection

## Security

The raffle system uses Flow's native secure randomness feature for fair and transparent winner selection. The smart contract implements a commit-reveal scheme to prevent manipulation of results.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License 