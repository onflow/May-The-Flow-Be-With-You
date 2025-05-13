# Submission: Week 1 Challenge - Randomness

## Flow Address
0x9f7145728ef9ae10 (FLOW)
0x000000000000000000000002A01c2368336B105C (FLOW EVM)

## Purpose

<div style="max-width: 300px;">
  <img src="https://github.com/user-attachments/assets/d4ebc614-bcfd-4db6-80eb-c420ed3bb4d2" alt="final" style="width: 40%;">
</div>

This is a Ghibli-style headshot generator that utilizes Flow on-chain randomness to randomly select phrases (costume, accessory, and background) from a list and form a final prompt. This prompt is then fed into the OpenAI image model to generate a fully random Ghibli-style headshot. We provide implementations of the randomness logic in both Solidity and Cadence versions. Feel free to switch between them and learn how they work. Have fun!.

## Testing Notes
- You will need to prepare some API keys: Open AI, Vercel Blob Read Write Token, Firebase
- Client dir contains a NextJS simple dapp frontend
- Backend dir contains all the serverless functions on Vercel
- Solidity and Cadence contracts are stored in Backend dir
