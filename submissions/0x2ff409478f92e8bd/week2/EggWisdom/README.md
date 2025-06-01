# 🥚 EggWisdom

A CryptoKitties-inspired game on the Flow blockchain, where users can mint NFTs, upload images, and earn Zen tokens.

## Features

- **Wallet Connection**: Seamlessly connect with Flow wallet providers on testnet.
- **NFT Minting**: Mint EggWisdom and WisdomPhrase NFTs.
- **Image Upload**: Share gaming moments with metadata like player and cat names.
- **Pet Interaction**: Interact with your EggWisdom NFTs to randomly change their metadata.
- **Leaderboard**: View top Zen token earners with real-time updates.
- **Responsive UI**: Mobile-first design with a colorful, playful interface.

## Tech Stack

- React 19
- TypeScript
- Flow Client Library (FCL)
- React Query
- Tailwind CSS
- Vite

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/eggwisdom.git
   cd eggwisdom
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp env.example .env.local
   ```
   Update the contract address in `.env.local`.

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser to the URL shown in the terminal.

## Build for Production

```
npm run build
```

The build output will be in the `dist` folder.

## Development Notes

- Maximum image upload size is 1MB, larger images will be automatically compressed.
- File uploads are converted to Base64 and stored on the blockchain.
- Zen token balance updates automatically after any successful transaction.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
