import { syncLeaderboardPeriod } from "../actions/transactions";
import {
    addresses,
    buildBlockchainContext,
    networks,
    waitForTransaction,
    type Network,
} from "../utils";

async function main() {
    const network = process.env.NETWORK as Network;
    if (!network || !networks.includes(network)) {
        console.error(
            `Please set NETWORK environment variable to either "${networks.join('" or "')}"`,
        );
        process.exit(1);
    }

    const ctx = await buildBlockchainContext();
    if (!ctx.wallet) {
        console.error(
            "No wallet in context, please set the FLOW_ADDRESS and FLOW_PRIVATE_KEY environment variables",
        );
        process.exit(1);
    }
    console.log(`Signer address: ${ctx.wallet.address}`);

    const txid = await syncLeaderboardPeriod(ctx.wallet);
    const result = await waitForTransaction(ctx.connector, txid);
    console.log("Transaction events:");
    if (result.events && result.events.length > 0) {
        for (const event of result.events) {
            console.log(`- [${event.type}]`);
            console.log("  Data:", JSON.stringify(event.data, null, 2));
        }
    } else {
        console.log("No events emitted.");
    }

    process.exit(0);
}

main().catch(console.error);
