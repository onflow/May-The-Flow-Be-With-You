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

export const contracts: Record<string, Record<Network, string>> = {
    Leaderboard: {
        emulator: `0x${flowJSON.contracts.Leaderboard.aliases.emulator}`,
        mainnet: `0x${flowJSON.contracts.Leaderboard.aliases.mainnet}`,
        testnet: `0x${flowJSON.contracts.Leaderboard.aliases.testnet}`,
    },
};
