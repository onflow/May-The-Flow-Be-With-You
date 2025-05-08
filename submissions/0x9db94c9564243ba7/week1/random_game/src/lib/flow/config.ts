import { useFlowConfig, FlowNetwork } from "@onflow/kit";

export const useFlowConfiguration = () => {
  const config = useFlowConfig();
  
  return {
    accessNodeUrl: "https://access-testnet.onflow.org", // Using testnet for development
    flowNetwork: "testnet" as FlowNetwork,
    appDetailTitle: "Flow Dice Game",
    appDetailIcon: "/dice-icon.png", // You'll need to add this icon to your public folder
    appDetailDescription: "A decentralized dice game on Flow",
    appDetailUrl: "https://your-app-url.com", // Update this with your actual URL
    ...config
  };
}; 