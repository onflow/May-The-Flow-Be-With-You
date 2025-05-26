# May the Flow Be With You

**Participant:** Tobin Sia  
**Flow Address:** `0xe712bbfbeeef1cfa`

This repository documents my progress in the **May the Flow Be With You** coding challenge (May 2025). Each week’s folder will include a unique project submission exploring Flow blockchain concepts using Cadence and front-end tools.

---

## 📅 Week 1 — WheelOfFortune 🎲

**Theme:** The Randomness Revolution

For Week 1, I created an interactive smart contract that simulates a **spin-the-wheel game** with weighted reward segments. Users connect their wallet through the React frontend and trigger a Flow transaction that emits a spin result based on a deterministic pseudo-random number (derived from block timestamps).

- ✅ Smart contract deployed to Flow Testnet: `0xb3905e10b1e5c542`
- ✅ Frontend built in React with animated wheel and FCL wallet integration
- ❌ No token transfers yet — rewards are virtual labels (e.g., "100 FLOW", "Try Again")

🧠 **Key learning from Week 1:**
Building a deterministic reward system on-chain without access to true randomness, and handling FCL transaction logic on the frontend.

---

## 📅 Week 2 — ToTheMOONNNN 🎮

**Theme:** Actually Fun Games

For Week 2, I built **Click-to-Moon**, a meme-infused clicker game where players generate *thrust points* by clicking a rocket. Players can upgrade their boosters, automate thrust generation, and race to reach the Moon.

- ✅ Frontend built in React with animated rocket and real-time thrust counter
- ✅ Players can upgrade boosters to increase thrust per click
- Planning to include a feature such that players progress are saved on-chain

🧠 **Key learning from Week 2:**  
Balancing state management with fun gameplay mechanics and creating a gameplay loop that is simple but addictive.

---

## 📅 Week 3 — Generative Tarot AI 🔮

**Theme:** Generative Art and Worlds

For Week 3, I created **Generative Tarot AI**, a mystical NFT experience where users draw a unique Tarot card generated with the help of AI and minted on the Flow blockchain. Each card contains:

- 🎴 A **Tarot card title** from a curated list of 10 archetypal cards (e.g., *The Fool*, *The Tower*, *The Star*)
- 🎨 An **AI-generated image** representing the card
- ⛓️ A Cadence-powered **smart contract** that mints the card

- ✅ Minting and reading functionality deployed to Flow Testnet
- ✅ Frontend built in React: Users draw, read, and mint their Tarot cards

🧠 **Key learning from Week 3:**  
Blending AI creativity with smart contract logic to create composable, interpretable NFTs. It was especially fun working with dynamic metadata and making each mint feel like a one-of-a-kind experience.

---

## 📅 Week 4 — MemoMint 🧠📝

**Theme:** AI and LLMs

For Week 4, I built **MemoMint**, a reflective journaling dApp where users chat with an AI agent about their thoughts or week. At the end of the conversation, the AI summarizes it and mints the reflection as a Flow NFT diary entry.

- ✅ LLM-powered chatbot
- ✅ Backend powered by FastAPI, with endpoints for chat and summary
- ✅ Flow integration: summary is minted as an NFT using Cadence and Flow CLI
- ✅ Frontend lets users chat, view summary, and mint with one click

🧠 **Key learning from Week 4:**  
Creating a personal, emotionally resonant use case for LLMs and NFTs. MemoMint bridges meaningful conversations and blockchain permanence in a way that feels both useful and poetic.

---

## 🛠 Tech Stack Across All Weeks

- **Smart Contracts:** Cadence (Flow blockchain)
- **Frontend:** React + TypeScript + Styled Components
- **Wallet Integration:** Flow Client Library (FCL)
- **Backend:** Python (FastAPI)
- **AI Integration:** OpenRouter API (Mistral 7B)
- **Deployment Target:** Flow Testnet

---

Stay tuned — more weeks and builds coming soon.
