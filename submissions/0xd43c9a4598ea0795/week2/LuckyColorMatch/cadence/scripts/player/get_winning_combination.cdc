/// @title Get Winning Combination Script (Player)
/// @author Rooroo Documenter
/// @notice This script retrieves the winning color combination for a specific, completed
/// game round in the LuckyColorMatch game.
/// It should only return a value after the round has finished and the lucky combination
/// has been determined and revealed.

import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc" /// Imports the main LuckyColorMatch contract.

/// Main function of the script.
/// Fetches the round information for the given `roundID` and returns the
/// `luckyCombination`'s colors if available.
///
/// Parameters:
/// - roundID: The `UInt64` ID of the game round for which to retrieve the winning combination.
///
/// Returns: An optional array of strings `[String]?` representing the winning color combination.
///   Returns `nil` if:
///   - The specified `roundID` does not exist.
///   - The lucky combination for the round has not yet been determined or revealed (i.e., `roundInfo.luckyCombination` is `nil`).
///
/// Panics if:
/// - Information for the specified `roundID` cannot be retrieved at all (e.g., `getRoundInfo` returns `nil` and the panic message executes, though the script intends to return `nil` gracefully if `luckyCombination` itself is `nil`).
pub fun main(roundID: UInt64): [String]? {
    // Retrieve the detailed information for the specified round.
    let roundInfo = LuckyColorMatch.getRoundInfo(roundID: roundID)
        ?? panic("Failed to retrieve information for round ID: ".concat(roundID.toString()).concat(". The round may not exist."))

    // Check if the lucky combination has been set for this round.
    // It will be `nil` if the round is not yet finished or if randomness hasn't been processed.
    if roundInfo.luckyCombination == nil {
        log("Lucky combination for round ".concat(roundID.toString()).concat(" has not been revealed yet."))
        return nil
    }

    // If the lucky combination exists, return its colors.
    // The `luckyCombination` field in `RoundInfo` is of type `LuckyColorMatch.ColorCombination?`.
    return roundInfo.luckyCombination!.colors
}