import flowJSON from "../../flow.json" assert { type: "json" };

// import { dirname } from "node:path";
// import { fileURLToPath } from "node:url";

// // Get the directory name of the current file
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export const networks = ["mainnet", "testnet", "emulator"] as const;

export type Network = (typeof networks)[number];

export const networkName: Network = (process.env.NETWORK as Network) || "testnet";

export { flowJSON };

export const addresses = {
    LeaderboardService: {
        emulator: "0xf8d6e0586b0a20c7",
        mainnet: "0x",
        testnet: "0xe647591c05619dba",
    },
};
