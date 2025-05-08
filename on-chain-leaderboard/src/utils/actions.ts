import type { FlowWallet } from "./flow";
import type { IFlowScriptExecutor } from "./types";

// Scripts
import scriptCheckSubmissionStatus from "../../cadence/scripts/check-submission-status.cdc?raw";
import scriptGetLeaderboard from "../../cadence/scripts/get-leaderboard.cdc?raw";
// Transactions
import trxSubmitTopic from "../../cadence/transactions/submit-a-topic.cdc?raw";
import trxSyncLeaderboardDefault from "../../cadence/transactions/sync-leaderboard-default.cdc?raw";

// Scripts actions

// export async function getEVMAssets(flowExecutor: IFlowScriptExecutor): Promise<null> {
//     const result = await flowExecutor.executeScript(
//         scriptGetFtContractByEVM,
//         (arg, t) => [arg(evmContractAddress.toLowerCase(), t.String)],
//         null,
//     );
//     return result;
// }

// Transactions actions

// export async function registerEVMAsset(flowWallet: FlowWallet): Promise<string> {
//     const txid = await flowWallet.sendTransaction(trxRegisterEVMAsset, (arg, t) => [
//         arg(evmContractAddress.toLowerCase(), t.String),
//     ]);
//     return txid;
// }