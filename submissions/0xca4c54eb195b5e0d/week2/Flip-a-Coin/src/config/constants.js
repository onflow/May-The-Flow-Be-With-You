export const NETWORK = {
  TESTNET: "testnet",
  MAINNET: "mainnet",
  EMULATOR: "emulator"
};

export const CONTRACTS = {
  TESTNET: {
    COIN_FLIP: "0xCoinFlip",
    FUNGIBLE_TOKEN: "0x9a0766d93b6608b7",
    FLOW_TOKEN: "0x7e60df042a9c0868"
  },
  MAINNET: {
    COIN_FLIP: "0xCoinFlip",
    FUNGIBLE_TOKEN: "0xf233dcee88fe0abe",
    FLOW_TOKEN: "0x1654653399040a61"
  },
  EMULATOR: {
    COIN_FLIP: "0xf8d6e0586b0a20c7",
    FUNGIBLE_TOKEN: "0xee82856bf20e2aa6",
    FLOW_TOKEN: "0x0ae53cb6e3f42a79"
  }
};

export const MIN_BET_AMOUNT = 0.1;
export const MAX_BET_AMOUNT = 100;

export const ANIMATION_DURATION = 1000; // ms 