import { config } from "@onflow/fcl";

// Flow access node and contract configuration
const flowAccessNode = import.meta.env.VITE_FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org";
const flowAppNetwork = import.meta.env.VITE_FLOW_NETWORK || "testnet";
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000"; // Replace with actual contract address

// Configure FCL for testnet
config({
  "accessNode.api": flowAccessNode,
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "EggWisdom",
  "app.detail.icon": "/logo.png",
  "flow.network": flowAppNetwork,
  "0xEggWisdom": contractAddress
});

// Export configured addresses for use in the app
export const FLOW_ADDRESSES = {
  EggWisdom: contractAddress
}; 