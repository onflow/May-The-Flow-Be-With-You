# Mint Your Name as an NFT on Flow Blockchain

A modern web application that allows users to mint their names as NFTs on the Flow blockchain. Built with Next.js, TypeScript, and Flow Client Library (FCL).

![Mint Your Name as NFT](https://placekitten.com/g/200/200)

## 🌟 Features

- **Flow Wallet Integration**: Seamlessly connect your Flow wallet using FCL
- **NFT Minting**: Mint your name as a unique NFT on the Flow blockchain
- **Modern UI**: Beautiful, responsive design with gradient effects and animations
- **Real-time Feedback**: Clear error handling and loading states
- **Testnet Support**: Currently configured for Flow testnet

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Flow wallet (like Blocto or Flow Wallet)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mint-your-name-nft.git
cd mint-your-name-nft
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 💻 Usage

1. **Connect Your Wallet**
   - Click the "Connect Flow Wallet" button
   - Select your preferred Flow wallet provider
   - Approve the connection request

2. **Mint Your Name**
   - Enter your name in the input field
   - Click the "Mint NFT" button
   - Approve the transaction in your wallet
   - Wait for the transaction to be confirmed

3. **View Your NFT**
   - Your minted NFT will be available in your Flow wallet
   - You can view it on Flow blockchain explorers

## 🛠️ Technical Stack

- **Frontend Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Flow Client Library (FCL)
- **Smart Contracts**: Cadence

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   ├── cadence/          # Flow smart contracts
│   ├── config/           # Configuration files
│   └── lib/              # Utility functions
├── public/              # Static assets
└── ...config files
```

## 🔧 Configuration

The application is configured to use the Flow testnet by default. You can modify the network settings in `src/config/flow.ts`:

```typescript
fcl.config({
  'app.detail.title': 'Name NFT Minter',
  'app.detail.icon': 'https://placekitten.com/g/200/200',
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
  'flow.network': 'testnet',
});
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Flow Blockchain
- Next.js Team
- Tailwind CSS
- All contributors and users of this project

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/yourusername/mint-your-name-nft/issues) section
2. Create a new issue if your problem isn't already listed
3. Join our community discussions

## 🔗 Useful Links

- [Flow Documentation](https://docs.onflow.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Flow Client Library](https://github.com/onflow/fcl-js)
