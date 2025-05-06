import * as fcl from "@onflow/fcl";

// Configure Flow client
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "Wheel of Fortune",
  "app.detail.icon": "https://placekitten.com/g/200/200"
});

export default fcl; 