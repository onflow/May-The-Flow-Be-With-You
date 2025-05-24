import type { IFlowScriptExecutor, ParticipantScoreRecord, TopicResult } from "../utils/types";
import { addresses, networkName } from "../utils/config";

import scriptCheckSubmissionStatus from "../../cadence/scripts/check-submissions-status.cdc?raw";
import scriptGetLeaderboard from "../../cadence/scripts/get-leaderboard.cdc?raw";

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
