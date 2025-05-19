import { config } from "@onflow/fcl";

config({
  "app.detail.title": "Flow Coin Flip",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "accessNode.api": "http://localhost:3569",
  "discovery.wallet": "http://localhost:8701/fcl/authn",
  "0xCoinFlip": "0xf8d6e0586b0a20c7", // The address where your contract is deployed
}); 