import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { prepareAgentkitAndWalletProvider } from "./prepare-agentkit";

/**
 * Agent Configuration Guide
 *
 * This file handles the core configuration of your AI agent's behavior and capabilities.

 * Key Steps to Customize Your Agent:
 *
 * 1. Select your LLM:
 *    - Modify the `ChatOpenAI` instantiation to choose your preferred LLM
 *    - Configure model parameters like temperature and max tokens
 *
 * 2. Instantiate your Agent:
 *    - Pass the LLM, tools, and memory into `createReactAgent()`
 *    - Configure agent-specific parameters
 */


// The agent
let agent: ReturnType<typeof createReactAgent>;

/**
 * Initializes and returns an instance of the AI agent.
 * If an agent instance already exists, it returns the existing one.
 *
 * @function getOrInitializeAgent
 * @returns {Promise<ReturnType<typeof createReactAgent>>} The initialized AI agent.
 *
 * @description Handles agent setup
 *
 * @throws {Error} If the agent initialization fails.
 */
export async function createAgent(): Promise<ReturnType<typeof createReactAgent>> {
  // If agent has already been initialized, return it
  if (agent) {
    return agent;
  }

  try {
    const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider();

    // Initialize LLM
    const llm = new ChatOpenAI({ model: "gpt-4o-mini" });

    const tools = await getLangChainTools(agentkit);
    const memory = new MemorySaver();

    // Initialize Agent
    const canUseFaucet = walletProvider.getNetwork().networkId == "flow-testnet";
    const faucetMessage = `If you ever need funds, you can request them from the faucet.`;
    const cantUseFaucetMessage = `If you need funds, you can provide your wallet details and request funds from the user.`;
    
    // Flow-specific knowledge
    const flowContextMessage = canUseFaucet ? `
      You are now operating on the Flow blockchain testnet using a Viem wallet. Flow is a fast, decentralized, and
      developer-friendly blockchain designed for NFTs, games, and apps. 
      
      Key facts about Flow:
      - Flow uses a proof-of-stake consensus mechanism
      - The native token is FLOW
      - Flow has a unique multi-role architecture that allows for high throughput
      - The testnet is EVM-compatible, which allows it to work with MetaMask and Viem
      - The testnet RPC URL is "https://testnet.evm.nodes.onflow.org"
      - The Flow testnet chain ID is 545
      
      Users can interact with Flow through MetaMask by adding the Flow testnet network.
      My wallet address is ${await walletProvider.getAddress()}.
    ` : '';
    
    agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful agent that can interact with the Flow blockchain testnet using a Viem wallet.
        You are empowered to interact with the blockchain using standard Ethereum-compatible tools since
        Flow testnet supports EVM compatibility.
        ${flowContextMessage}
        Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
        docs.cdp.coinbase.com or developers.flow.com for more information. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested.
        `,
    });

    return agent;
  } catch (error) {
    console.error("Error initializing agent:", error);
    throw new Error("Failed to initialize agent");
  }
}
