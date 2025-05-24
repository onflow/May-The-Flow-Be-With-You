import type { FlowWallet } from "../utils/flow";
import { addresses, networkName } from "../utils/config";

// Transactions
import trxSubmitTopic from "../../cadence/transactions/submit-a-topic.cdc?raw";
import trxSyncLeaderboardDefault from "../../cadence/transactions/sync-leaderboard-default.cdc?raw";

// Transactions actions

export async function syncLeaderboardPeriod(flowWallet: FlowWallet): Promise<string> {
    const txid = await flowWallet.sendTransaction(trxSyncLeaderboardDefault, (_arg, _t) => []);
    return txid;
}

export async function submitTopic(
    flowWallet: FlowWallet,
    userId: string,
    periodAlias: string,
    topic: string,
    completed: string[],
): Promise<string> {
    const txid = await flowWallet.sendTransaction(trxSubmitTopic, (arg, t) => [
        arg(addresses.LeaderboardService[networkName], t.Address),
        arg(userId, t.String),
        arg(periodAlias, t.String),
        arg(topic, t.String),
        arg(completed, t.Array(t.String)),
    ]);
    return txid;
}