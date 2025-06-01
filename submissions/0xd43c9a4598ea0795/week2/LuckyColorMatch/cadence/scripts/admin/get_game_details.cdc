/// @title Get Game Details Script (Admin)
/// @author Rooroo Documenter
/// @notice This script retrieves various static and dynamic configuration details
/// and current state information from the LuckyColorMatch contract.
/// It is primarily intended for administrative or informational purposes to get an
/// overview of the game's parameters.
import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc"
/// Imports the main LuckyColorMatch contract to access its public fields and functions.

// This script retrieves general details about the LuckyColorMatch game.
// It's intended for admin or informational purposes.

/// Main function of the script.
/// Reads several public fields from the LuckyColorMatch contract and returns them
/// in a dictionary.
///
/// Returns: A `String` to `AnyStruct` dictionary containing game details such as:
///   - `gameAdmin`: The `Address` of the game administrator.
///   - `entryFeeAmount`: The `UFix64` entry fee for participating in a round.
///   - `nextRoundID`: The `UInt64` ID for the next game round to be created.
///   - `vrfCoordinatorAddress`: The `Address` of the VRF coordinator contract used for randomness.
///   - `availableColors`: An array of `String` representing the pool of colors players can choose from.
///   - `combinationLength`: The `Int` number of colors players must choose for their combination.
///   - `totalRoundsCreated`: The `UInt64` total number of rounds created so far (derived from `nextRoundID`).
pub fun main(): {String: AnyStruct} {
    let gameAdmin = LuckyColorMatch.GameAdmin
    let entryFee = LuckyColorMatch.entryFeeAmount
    let nextRoundID = LuckyColorMatch.nextRoundID
    let vrfCoordinatorAddress = LuckyColorMatch.vrfCoordinatorAddress
    let availableColors = LuckyColorMatch.availableColors
    let combinationLength = LuckyColorMatch.CombinationLength
    // Add any other static or top-level public details you want to expose

    let details: {String: AnyStruct} = {
        "gameAdmin": gameAdmin,
        "entryFeeAmount": entryFee,
        "nextRoundID": nextRoundID,
        "vrfCoordinatorAddress": vrfCoordinatorAddress,
        "availableColors": availableColors,
        "combinationLength": combinationLength,
        "totalRoundsCreated": nextRoundID - 1 // Assuming nextRoundID starts at 1 and increments
    }

    return details
}