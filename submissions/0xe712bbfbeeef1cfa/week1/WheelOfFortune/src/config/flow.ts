import * as fcl from "@onflow/fcl";

// Configure Flow client
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "Wheel of Fortune",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "fcl.accountProof.resolver": "https://fcl-discovery.onflow.org/testnet/authn",
  "fcl.accountProof.resolver.include": ["0x586b8d7260d25ea5"],
  "fcl.accountProof.resolver.exclude": [],
  "fcl.accountProof.resolver.includeAll": true
});

export default fcl; 