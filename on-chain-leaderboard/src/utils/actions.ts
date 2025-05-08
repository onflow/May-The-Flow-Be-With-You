import type { FlowWallet } from "./flow";
import type { IFlowScriptExecutor, ParticipantScoreRecord, TopicResult } from "./types";
import { addresses, networkName } from "./config";

// Scripts
import scriptCheckSubmissionStatus from "../../cadence/scripts/check-submission-status.cdc?raw";
import scriptGetLeaderboard from "../../cadence/scripts/get-leaderboard.cdc?raw";
// Transactions
import trxSubmitTopic from "../../cadence/transactions/submit-a-topic.cdc?raw";
import trxSyncLeaderboardDefault from "../../cadence/transactions/sync-leaderboard-default.cdc?raw";

// Scripts actions

export async function getLeaderboard(
    flowExecutor: IFlowScriptExecutor,
    periodAlias?: string,
): Promise<ParticipantScoreRecord[]> {
    const result = await flowExecutor.executeScript(
        scriptGetLeaderboard,
        (arg, t) => [
            arg(addresses.LeaderboardService[networkName], t.Address),
            arg(periodAlias, t.Optional(t.String)),
        ],
        // biome-ignore lint/suspicious/noExplicitAny: parse result
        [] as any[],
    );
    return result
        .map((r) => ({
            participant: r.participant,
            score: Number.parseFloat(r.score),
        }))
        .sort((a, b) => b.score - a.score);
}

export async function getSubmissionStatus(
    flowExecutor: IFlowScriptExecutor,
    userId: string,
    periodAlias: string,
    topics: string[],
): Promise<TopicResult[]> {
    const result = await flowExecutor.executeScript(
        scriptCheckSubmissionStatus,
        (arg, t) => [
            arg(addresses.LeaderboardService[networkName], t.Address),
            arg(addresses.LeaderboardService[networkName], t.Address),
            arg(userId, t.String),
            arg(periodAlias, t.String),
            arg(topics, t.Array(t.String)),
        ],
        // biome-ignore lint/suspicious/noExplicitAny: parse result
        [] as any[],
    );
    return result;
}

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