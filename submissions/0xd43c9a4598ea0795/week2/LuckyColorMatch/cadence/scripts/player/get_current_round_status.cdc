/// @title Get Current Round Status Script (Player)
/// @author Rooroo Documenter
/// @notice This script retrieves comprehensive status information for the current
/// (i.e., most recently started or active) game round in the LuckyColorMatch game.
/// It provides details like round ID, start/close times, current status as a string,
/// prize pool amount, and number of participants.
import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc"
/// Imports the main LuckyColorMatch contract to access its data and functions.

// This script retrieves the status of the current (latest) game round.
// It returns the round ID, start time, close time (if any), and current status.

/// Main function of the script.
/// Fetches information for the current game round and formats it into a dictionary.
///
/// Returns: An optional dictionary (`{String: AnyStruct}?`) containing details of the current round.
///   Returns `nil` if no round information can be found (e.g., no rounds started yet).
///   The dictionary includes:
///   - `roundID`: (`UInt64`) The ID of the current round.
///   - `startTime`: (`UFix64`) The timestamp when the round started.
///   - `closeTime`: (`UFix64?`) The timestamp when the round was closed for submissions (nil if still active).
///   - `status`: (`String`) The current status of the round (e.g., "Active", "Closed", "Finished").
///   - `prizePoolAmountForRound`: (`UFix64`) The current total prize pool for this round.
///   - `numberOfParticipants`: (`Int`) The number of unique players who have submitted entries for this round.
pub fun main(): {String: AnyStruct}? {
    let currentRoundID = LuckyColorMatch.getCurrentRoundID()
    let roundInfo = LuckyColorMatch.getRoundInfo(roundID: currentRoundID)

    if roundInfo == nil {
        return nil // No active or past round found
    }

    // Convert enum status to string for easier consumption by clients/tests
    /// Helper variable to store the string representation of the round's status enum.
    var statusString = ""
    switch roundInfo!.status {
        case LuckyColorMatch.RoundStatus.Pending:
            statusString = "Pending"
        case LuckyColorMatch.RoundStatus.Active:
            statusString = "Active"
        case LuckyColorMatch.RoundStatus.Closed:
            statusString = "Closed"
        case LuckyColorMatch.RoundStatus.AwaitingRandomness:
            statusString = "AwaitingRandomness"
        case LuckyColorMatch.RoundStatus.CalculatingWinners:
            statusString = "CalculatingWinners"
        case LuckyColorMatch.RoundStatus.PayingOut:
            statusString = "PayingOut"
        case LuckyColorMatch.RoundStatus.Finished:
            statusString = "Finished"
        default:
            statusString = "Unknown"
    }

    let result: {String: AnyStruct} = {
        "roundID": roundInfo!.roundID,
        "startTime": roundInfo!.startTime,
        "closeTime": roundInfo!.closeTime,
        "status": statusString, // Using the string representation
        "prizePoolAmountForRound": roundInfo!.prizePoolAmountForRound,
        "numberOfParticipants": roundInfo!.participatingPlayers.length
    }

    return result
}