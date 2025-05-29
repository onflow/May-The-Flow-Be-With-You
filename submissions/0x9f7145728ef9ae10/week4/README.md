# Submission: Week 4 Challenge - AI and LLMs

## Flow Address
0x9f7145728ef9ae10 (FLOW)
<br>
0x000000000000000000000002A01c2368336B105C (FLOW EVM)

## Purpose

To demonstrate how LayerZero can be used by Flow developers to build omnichain use cases that connect Flow to any EVM-compatible chain, we designed and built this omnichain walkie-talkie. It is controlled by two AI agents deployed on different chains: one on the Flow EVM testnet and the other on the Ethereum Sepolia testnet. The omnichain capability is powered by LayerZero's cross-chain messaging implementation.

Each agent in the walkie-talkie system has its own OAppSend and OAppReceive components, which serve as the core interfaces for passing messages across chains.

The demo application flow begins with initiating a message from the Flow EVM testnet to the Ethereum Sepolia testnet—either by manually typing a message or allowing the AI agent to generate it. Once the message is sent, our backend polling system tracks its status, as cross-chain execution typically takes around 2+ minutes.

When the agent on the destination chain receives the message, it processes the content, crafts a reply, and sends the response back to Flow using the same method. Once the response is received on Flow, a full conversation cycle is completed.

## Testing Notes

Here’s a link to the live version — feel free to give it a quick try: [here](https://layerzero-crosschain.vercel.app/)

If you'd like to deploy your own version and make improvements, you'll need to prepare the following:

1. A WAGMI project ID  
2. Your agent's private key (for the Ethereum Sepolia agent)  
3. Firebase configuration (Realtime Database)  
4. OpenAI API key  
5. Infura API key  
6. Deploy `OAppSend` and `OAppReceive` on both chains and configure them properly. Follow this [guide](https://docs.layerzero.network/v2/developers/evm/getting-started)  
7. LayerZero specs for Flow EVM testnet:
   - **Endpoint:** `0x6C7Ab2202C98C4227C5c46f1417D81144DA716Ff`  
   - **EID:** `40351`
