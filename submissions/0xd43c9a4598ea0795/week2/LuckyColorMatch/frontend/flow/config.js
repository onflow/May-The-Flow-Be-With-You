import { config } from "@onflow/fcl";

// Emulator addresses - these should match your flow.json aliases for the emulator network
const LUCKY_COLOR_MATCH_ADDRESS = "0xf8d6e0586b0a20c7";
const FUNGIBLE_TOKEN_ADDRESS = "0xee82856bf20e2aa6";
const NON_FUNGIBLE_TOKEN_ADDRESS = "0x1d7e57aa55817448";
const LUCKY_CHARM_NFT_ADDRESS = "0xf8d6e0586b0a20c7";
const ACHIEVEMENT_BADGE_NFT_ADDRESS = "0xf8d6e0586b0a20c7";
const IVRF_COORDINATOR_ADDRESS = "0xf8d6e0586b0a20c7"; // MockVRFCoordinator for emulator
const METADATA_VIEWS_ADDRESS = "0x1d7e57aa55817448"; // Standard MetadataViews address for emulator

config({
  "app.detail.title": "Lucky Color Match",
  "app.detail.icon": "https://placekitten.com/g/200/200", // Replace with your app icon
  "accessNode.api": "http://localhost:8888", // Emulator default
  "discovery.wallet": "http://localhost:8701/fcl/authn", // Emulator FCL Dev Wallet
  "flow.network": "emulator",

  // Contract Aliases
  "0xLUCKYCOLORMATCH": LUCKY_COLOR_MATCH_ADDRESS,
  "0xFUNGIBLETOKEN": FUNGIBLE_TOKEN_ADDRESS,
  "0xNONFUNGIBLETOKEN": NON_FUNGIBLE_TOKEN_ADDRESS,
  "0xLUCKYCHARMNFT": LUCKY_CHARM_NFT_ADDRESS,
  "0xACHIEVEMENTBADGENFT": ACHIEVEMENT_BADGE_NFT_ADDRESS,
  "0xIVRFCOORDINATOR": IVRF_COORDINATOR_ADDRESS,
  "0xMETADATAVIEWS": METADATA_VIEWS_ADDRESS,

  // Aliases used in Cadence templates (ensure these match contract imports if using string replacement)
  // These are slightly different from the above FCL config aliases for direct use in Cadence code.
  "LuckyColorMatch": LUCKY_COLOR_MATCH_ADDRESS,
  "FungibleToken": FUNGIBLE_TOKEN_ADDRESS,
  "NonFungibleToken": NON_FUNGIBLE_TOKEN_ADDRESS,
  "LuckyCharmNFT": LUCKY_CHARM_NFT_ADDRESS,
  "AchievementBadgeNFT": ACHIEVEMENT_BADGE_NFT_ADDRESS,
  "IVRFCoordinator": IVRF_COORDINATOR_ADDRESS,
  "MetadataViews": METADATA_VIEWS_ADDRESS
});