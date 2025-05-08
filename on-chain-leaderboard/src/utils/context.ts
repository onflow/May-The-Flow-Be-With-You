import { type Network, networkName, networks } from "./config";
import { flowJSON } from "./config";
import { FlowConnector, FlowWallet } from "./flow";
import type { FlowBlockchainContext } from "./types";

export async function buildBlockchainContext(
    network: Network = networkName,
): Promise<FlowBlockchainContext> {
    if (!networks.includes(network)) {
        throw new Error(`Unsupported network: ${network}`);
    }
    const connector = new FlowConnector(flowJSON, network);
    let wallet: FlowWallet | undefined = undefined;
    try {
        wallet = new FlowWallet(connector);
    } catch (_e) {
        // No need to log error here, it's probably because the wallet is not set
    }
    return { connector, wallet };
}
