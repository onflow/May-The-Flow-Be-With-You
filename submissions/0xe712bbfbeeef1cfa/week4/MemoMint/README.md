# MemoMint 🧠📝

MemoMint is a reflective journaling dApp that transforms meaningful conversations with an AI into permanent, collectible NFTs on the Flow blockchain. Users chat with an AI agent about their week, thoughts, or anything personal — and at the end, the AI summarizes the session and allows them to mint it as a diary entry NFT.

## 🧠 Features

- AI-powered journaling assistant
- Personalized summaries generated from user conversations
- One-click NFT minting on Flow Testnet using Cadence
- Chat UI with conversation memory and markdown support
- Emotionally resonant way to capture and store memories on-chain

## 📦 Prerequisites

- Node.js 14+ and npm
- Flow CLI for contract deployment and minting
- OpenAI API key (for backend, if using OpenAI)
- HuggingFace API key (for frontend, required)

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd MemoMint
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Backend (.env in src/backend)
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
FLOW_ACCESS_NODE=https://access-testnet.onflow.org
NON_FUNGIBLE_TOKEN_ADDRESS=0x631e88ae7f1d7c20
MEMO_MINT_ADDRESS=your_deployed_contract_address

# Frontend (.env in src/frontend)
REACT_APP_FLOW_ACCESS_NODE=https://access-testnet.onflow.org
REACT_APP_NON_FUNGIBLE_TOKEN_ADDRESS=0x631e88ae7f1d7c20
REACT_APP_MEMO_MINT_ADDRESS=your_deployed_contract_address
REACT_APP_HUGGINGFACE_API_KEY='your_huggingface_api_key_here'
```

> **Note:**
> - To use the AI chat and summarization features, you must create a `.env` file in the `src/frontend` directory and add your HuggingFace API key as shown above.
> - You can obtain a HuggingFace API key by signing up at https://huggingface.co/ and generating an access token from your account settings.

4. Deploy the smart contract:
```bash
cd src/cadence
flow deploy
```

5. Start the development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run start:backend
npm run start:frontend
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.

## 📝 Usage

1. Connect your Flow wallet using the "Connect Wallet" button
2. Start a conversation with the AI assistant
3. When you're done, click "Generate Summary"
4. Review the summary and click "Mint as NFT" to create your NFT

## 🛠️ Tech Stack

- Frontend: React, TypeScript, TailwindCSS
- Backend: Node.js, Express
- AI: OpenAI API, HuggingFace Inference API
- Blockchain: Flow
- Smart Contracts: Cadence

## 📄 License

MIT