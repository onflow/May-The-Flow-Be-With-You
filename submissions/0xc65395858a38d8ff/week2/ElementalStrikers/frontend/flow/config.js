import { config } from "@onflow/fcl";

config({
  "accessNode.api": "https://rest-testnet.onflow.org", // Endpoint del nodo de acceso de Flow Testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Endpoint de descubrimiento de billeteras para Testnet
  "0xProfile": "0xba1132bc08f82fe2", // Dirección del contrato Profile en Testnet (si lo usas)
  // Reemplazos de direcciones de contrato para Testnet
  "0xNonFungibleToken": "0x631e88ae7f1d7c20",
  "0xFungibleToken": "0x9a0766d93b6608b7",
  "0xFlowToken": "0x7e60df042a9c0868",
  "0xMetadataViews": "0x631e88ae7f1d7c20",
  // Dirección de TU contrato ElementalStrikers en Testnet
  "0xElementalStrikers": "0xbeb2f48c3293e514" 
}); 