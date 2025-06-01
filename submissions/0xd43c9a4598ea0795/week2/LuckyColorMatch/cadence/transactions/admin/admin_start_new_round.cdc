/// @title Admin Start New Round Transaction
/// @author Rooroo Documenter
/// @notice This transaction allows the designated GameAdmin to initiate a new round
/// in the LuckyColorMatch game.
/// It calls the `startNewRound` function in the `LuckyColorMatch` contract.
import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc"
/// Imports the LuckyColorMatch contract to interact with its functions.

// This transaction allows the GameAdmin to start a new round of the LuckyColorMatch game.
/// Transaction definition for starting a new game round.
/// Signer: Must be the GameAdmin account as defined in the LuckyColorMatch contract.
transaction {

    /// Prepare phase: This phase is executed before the `execute` phase.
    /// It's used for setting up any necessary resources or performing checks.
    ///
    /// Parameters:
    /// - signer: The `AuthAccount` of the account that signed and submitted this transaction.
    ///           This account must be the GameAdmin.
    ///
    /// Preconditions:
    /// - The `signer`'s address must match the `LuckyColorMatch.GameAdmin` address.
    prepare(signer: AuthAccount) {
        // Preconditions are checked within the LuckyColorMatch.startNewRound() function itself,
        // such as ensuring the caller is the GameAdmin.
        // No specific preparation needed here beyond the signer being the GameAdmin.
        assert(signer.address == LuckyColorMatch.GameAdmin, message: "Only the GameAdmin can start a new round.")
    }

    /// Execute phase: This phase contains the main logic of the transaction.
    /// It calls the `startNewRound` public function on the `LuckyColorMatch` contract.
    /// Logs a message upon successful execution.
    execute {
        LuckyColorMatch.startNewRound()
        log("New game round started by admin: ".concat(signer.address.toString()))
    }
}