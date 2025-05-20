# 📅 Week 3 — Generative Tarot AI 🔮

**Theme:** Generative Art and Worlds

**Generative Tarot AI** is a mystical NFT experience built for Week 3 of the *May the Flow Be With You* hackathon. Users draw unique Tarot cards, each with AI-generated artwork and a GPT-powered interpretation, then mint them as NFTs on the Flow blockchain using Cadence smart contracts.

---

## 🔮 Features

- Draw a random Tarot card from the classic 78-card deck
- Each card includes:
  - 🎴 A unique title (e.g., *The Star*, *The Tower*)
  - 🎨 AI-generated card image (IPFS hosted)
  - 🧠 GPT-powered card interpretation
- Mint your card as an NFT on Flow testnet
- Modern frontend with React
- IPFS integration using `nft.storage`
- On-chain metadata storage (title, interpretation, image CID, timestamp)

---

## 🛠 Tech Stack

- **Smart Contracts:** Cadence (Flow blockchain)
- **Frontend:** React + Tailwind CSS
- **Wallet Integration:** Flow Client Library (FCL)
- **Image Hosting:** IPFS via `nft.storage`
- **AI Integration:** OpenAI GPT (dev-only for now)

---

## 📜 Card Generation Pipeline

1. User clicks “Draw a Card”
2. App randomly selects one of 78 classic Tarot archetypes
3. (Dev only) GPT generates a spiritual card interpretation
4. Pre-generated AI art is matched or fetched for the card
5. Metadata is bundled and minted to Flow testnet via Cadence

---

## 🧠 Key Learning

This week focused on integrating **dynamic, composable art and text into NFTs**, with metadata that feels personal and spiritually meaningful. I explored combining AI-driven creativity with Flow’s smart contract architecture, and began laying groundwork for a modular Tarot ecosystem that could support deck expansion or social readings.

---

## 🧪 Setup Instructions

### Prerequisites
- Node.js 14+ and npm

### Setup

```bash
git clone https://github.com/yourusername/GenerativeTarotAI.git
cd GenerativeTarotAI
npm install
npm start
