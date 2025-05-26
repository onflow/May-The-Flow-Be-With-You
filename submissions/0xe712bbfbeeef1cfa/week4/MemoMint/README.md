# MemoMint 🧠📝

MemoMint is a reflective journaling dApp that transforms meaningful conversations with an AI into permanent, collectible NFTs on the Flow blockchain. Users chat with an AI agent about their week, thoughts, or anything personal — and at the end, the AI summarizes the session and allows them to mint it as a diary entry NFT.

## 🧠 Features

- AI-powered journaling assistant
- Personalized summaries generated from user conversations
- One-click NFT minting on Flow Testnet using Cadence
- Chat UI with conversation memory and markdown support
- Emotionally resonant way to capture and store memories on-chain

## 📦 Prerequisites

- Python 3.9+ (for backend)
- Node.js 14+ and npm (for frontend)
- Flow CLI for contract deployment and minting

## 🚀 Getting Started

### Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\\Scripts\\activate`
pip install -r requirements.txt
uvicorn main:app --reload
