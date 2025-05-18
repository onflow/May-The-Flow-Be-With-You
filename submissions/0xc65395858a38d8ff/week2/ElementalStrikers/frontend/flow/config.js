import { config } from "@onflow/fcl";

// Definir el contrato de ElementalStrikers según la red
const contracts = {
  testnet: {
    ElementalStrikers: "0x1234567890abcdef", // Reemplazar con el address real en la testnet
    FungibleToken: "0x9a0766d93b6608b7",
    FlowToken: "0x7e60df042a9c0868",
    RandomBeaconHistory: "0xe467b9dd11fa00df",
  },
  emulator: {
    ElementalStrikers: "0xf8d6e0586b0a20c7", // Address local del emulador
    FungibleToken: "0xee82856bf20e2aa6",
    FlowToken: "0x0ae53cb6e3f42a79",
    RandomBeaconHistory: "0xf8d6e0586b0a20c7",
  }
};

// Configuración para la testnet de Flow
export const flowConfig = {
  "app.detail.title": "ElementalStrikers",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  
  // Ubicación de los contratos
  "0xElementalStrikers": contracts.testnet.ElementalStrikers,
  "0xFungibleToken": contracts.testnet.FungibleToken,
  "0xFlowToken": contracts.testnet.FlowToken,
  "0xRandomBeaconHistory": contracts.testnet.RandomBeaconHistory,

  // Configuración del DEV (emulador)
  ...(process.env.NEXT_PUBLIC_FLOW_NETWORK === "emulator" && {
    "accessNode.api": "http://localhost:8888",
    "discovery.wallet": "http://localhost:8701/fcl/authn",
    "0xElementalStrikers": contracts.emulator.ElementalStrikers,
    "0xFungibleToken": contracts.emulator.FungibleToken,
    "0xFlowToken": contracts.emulator.FlowToken,
    "0xRandomBeaconHistory": contracts.emulator.RandomBeaconHistory,
  }),
};

// Exportar la configuración para usarla en la aplicación
export default config(flowConfig); 