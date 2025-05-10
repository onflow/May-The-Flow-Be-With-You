# Flow Color Palette Generator

A decentralized color palette generator built on the Flow blockchain. This application generates random color palettes with 3-5 colors, perfect for designers, artists, and UI developers.

## Features

- Generate random color palettes with 3-5 colors
- View colors in both RGB and HEX formats
- Powered by Flow blockchain's native randomness
- Modern, responsive UI
- Real-time color generation

## Prerequisites

- Node.js (v14 or higher)
- Flow CLI
- Flow testnet account

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd flow-color-palette-generator
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the smart contract to Flow testnet:
```bash
flow project deploy --network=testnet
```

4. Update the contract address in `src/App.js` with your deployed contract address.

5. Start the development server:
```bash
npm start
```

## Usage

1. Select the number of colors you want in your palette (3-5)
2. Click the "Generate New Palette" button
3. View the generated colors in both RGB and HEX formats
4. Each color is displayed in a card with its corresponding color code

## Smart Contract

The smart contract uses Flow's built-in randomness feature to generate truly random colors. The contract is written in Cadence and includes:

- Color struct for RGB color representation
- ColorPalette struct for organizing multiple colors
- Functions for generating random colors and palettes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License 