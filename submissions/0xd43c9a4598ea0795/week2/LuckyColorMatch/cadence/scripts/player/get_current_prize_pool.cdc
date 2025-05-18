/// @title Get Current Prize Pool Script (Player)
/// @author Rooroo Documenter
/// @notice This script retrieves the total prize pool amount accumulated for the
/// current (i.e., most recently started or active) game round in the LuckyColorMatch game.

import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc" /// Imports the main LuckyColorMatch contract.

/// Main function of the script.
/// Fetches the ID of the current game round, then retrieves the round's information,
/// and finally returns the prize pool amount for that round.
///
/// Returns: `UFix64` - The total prize pool amount for the current game round.
///
/// Panics if:
/// - No game round has been started yet (i.e., `getCurrentRoundID()` might imply a default or error if no rounds).
/// - Information for the current round ID cannot be retrieved (e.g., if `getRoundInfo` returns `nil`).
pub fun main(): UFix64 {
    // Attempt to get the ID of the current/latest round.
    // Note: `getCurrentRoundID()` behavior if no rounds exist (e.g., initial state) should be understood.
    // Assuming it returns a valid ID if at least one round has been initiated.
    let currentRoundID = LuckyColorMatch.getCurrentRoundID()

    // Retrieve the detailed information for the current round using its ID.
    let roundInfo = LuckyColorMatch.getRoundInfo(roundID: currentRoundID)
        ?? panic("Failed to retrieve information for the current round (ID: ".concat(currentRoundID.toString()).concat("). Ensure a round is active or has been started."))

    // Return the prize pool amount stored within the round's information.
    return roundInfo.prizePoolAmountForRound
}