import { config } from "@onflow/config";

const MAINNET_ACCESS_NODE = "https://rest-mainnet.onflow.org";
const MAINNET_DISCOVERY_WALLET = "https://fcl-discovery.onflow.org/authn";
const MAINNET_DISCOVERY_WALLET_METHOD = "IFRAME/RPC"; // Para Blocto, Dapper, etc.

const TESTNET_ACCESS_NODE = "https://rest-testnet.onflow.org";
const TESTNET_DISCOVERY_WALLET = "https://fcl-discovery.onflow.org/testnet/authn";
const TESTNET_DISCOVERY_WALLET_METHOD = "IFRAME/RPC";

const EMULATOR_ACCESS_NODE = "http://localhost:8888"; // Asumiendo que el emulador corre en el puerto por defecto 8888
const EMULATOR_DISCOVERY_WALLET = "http://localhost:8701/fcl/authn"; // Asumiendo que el dev wallet corre en 8701
const EMULATOR_DISCOVERY_WALLET_METHOD = "IFRAME/RPC";

// --- Configuración de la red --- (Descomentar la que se quiera usar)
const FLOW_NETWORK = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet"; // "mainnet", "testnet", or "emulator"

console.log("Initializing FCL for network:", FLOW_NETWORK);

let accessNode = TESTNET_ACCESS_NODE;
let discoveryWallet = TESTNET_DISCOVERY_WALLET;
let discoveryWalletMethod = TESTNET_DISCOVERY_WALLET_METHOD;

if (FLOW_NETWORK === "mainnet") {
  accessNode = MAINNET_ACCESS_NODE;
  discoveryWallet = MAINNET_DISCOVERY_WALLET;
  discoveryWalletMethod = MAINNET_DISCOVERY_WALLET_METHOD;
} else if (FLOW_NETWORK === "emulator") {
  accessNode = EMULATOR_ACCESS_NODE;
  discoveryWallet = EMULATOR_DISCOVERY_WALLET;
  discoveryWalletMethod = EMULATOR_DISCOVERY_WALLET_METHOD;
}

config({
  "app.detail.title": "Primordia: Genesis Protocol",
  "app.detail.icon": "https://i.imgur.com/R3jYmPZ.png", // Placeholder icon, replace with your actual icon URL
  "accessNode.api": accessNode,
  "discovery.wallet": discoveryWallet,
  "discovery.wallet.method": discoveryWalletMethod,
  "0xNonFungibleToken": "0x631e88ae7f1d7c20", // Testnet & Mainnet NonFungibleToken address
  "0xMetadataViews": "0x631e88ae7f1d7c20",   // Testnet & Mainnet MetadataViews address
  "0xFungibleToken": "0x9a0766d93b6608b7",    // Testnet & Mainnet FungibleToken address
  "0xFlowToken": "0x7e60df042a9c0868",        // Testnet & Mainnet FlowToken address
  
  // --- Direcciones de Contratos (ajustar según la red) ---
  // Si usas emulador, estas direcciones probablemente serán diferentes (ej. 0x01, 0x02, etc., o las de tu flow.json)
  // Para Testnet, si has desplegado CreatureNFTV5 con tu cuenta `testnet-deployer` (0x2444e6b4d9327f09):
  "0xCreatureNFTV5": "0x2444e6b4d9327f09", // Reemplaza con la dirección real de tu contrato en Testnet/Mainnet

  // Si usas emulador, asegúrate de que estas coincidan con tu `flow.json`
  // "0xNonFungibleToken": "0xf8d6e0586b0a20c7", // Ejemplo para Emulador
  // "0xMetadataViews": "0xf8d6e0586b0a20c7",    // Ejemplo para Emulador
  // "0xFungibleToken": "0xee82856bf20e2aa6",     // Ejemplo para Emulador
  // "0xFlowToken": "0x0ae53cb6e3f42a79",         // Ejemplo para Emulador
  // "0xCreatureNFTV5": "0xf8d6e0586b0a20c7", // Ejemplo para Emulador
});

console.log("FCL Configured:", config().get("accessNode.api"), config().get("0xCreatureNFTV5")); 