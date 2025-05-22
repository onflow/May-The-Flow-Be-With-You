/// @title Get Player Round Details Script (Player)
/// @author Rooroo Documenter
/// @notice This script retrieves the participation details for a specific player
/// within a specified game round of the LuckyColorMatch game.
/// It returns information such as the player's chosen color combination and the fee they paid.
import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc"
/// Imports the main LuckyColorMatch contract to access its data and functions.

// This script retrieves a specific player's submission details for a given round.

/// A struct to encapsulate a player's participation details for a specific round.
///
/// Fields:
/// - playerAddress: The `Address` of the participating player.
/// - chosenCombination: An array of `String` representing the colors chosen by the player for that round.
/// - entryFeePaid: The `UFix64` amount of the entry fee paid by the player for that round.
pub struct PlayerRoundDetails {
    pub let playerAddress: Address
    pub let chosenCombination: [String]
    pub let entryFeePaid: UFix64
    // Add other relevant details if needed, e.g., if they won, prize amount

    /// Initializes a new `PlayerRoundDetails` struct.
    ///
    /// Parameters:
    /// - playerAddress: The player's address.
    /// - chosenCombination: The player's chosen color combination.
    /// - entryFeePaid: The entry fee paid by the player.
    init(playerAddress: Address, chosenCombination: [String], entryFeePaid: UFix64) {
        self.playerAddress = playerAddress
        self.chosenCombination = chosenCombination
        self.entryFeePaid = entryFeePaid
    }
}

/// Main function of the script.
/// Fetches the round information for the given `roundID`, then looks up the participation
/// details for the specified `playerAddress` within that round.
///
/// Parameters:
/// - roundID: The `UInt64` ID of the game round to query.
/// - playerAddress: The `Address` of the player whose details are being requested.
///
/// Returns: An optional `PlayerRoundDetails?` struct containing the player's participation details.
///   Returns `nil` if:
///   - The specified `roundID` does not exist.
///   - The specified `playerAddress` did not participate in that round or their details are not found.
pub fun main(roundID: UInt64, playerAddress: Address): PlayerRoundDetails? {
    let roundInfo = LuckyColorMatch.getRoundInfo(roundID: roundID)

    if roundInfo == nil {
        log("Round not found.")
        return nil
    }

    let playerBet = roundInfo!.participatingPlayers[playerAddress]

    if playerBet == nil {
        log("Player did not participate in this round or details not found.")
        return nil
    }

    return PlayerRoundDetails(
        playerAddress: playerBet!.playerAddress,
        chosenCombination: playerBet!.chosenCombination.colors,
        entryFeePaid: playerBet!.entryFeePaid
    )
}