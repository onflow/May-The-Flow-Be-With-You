/// @title Admin Close Round Transaction
/// @author Rooroo Documenter
/// @notice This transaction allows the designated GameAdmin to close the currently active
/// game round in the LuckyColorMatch game. Closing the round prevents further submissions
/// and initiates the process of requesting a random number via VRF to determine the
/// lucky combination.
/// It calls the `closeRound` function in the `LuckyColorMatch` contract.

import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc" /// Imports the LuckyColorMatch contract.

/// Transaction definition for closing an active game round.
/// Signer: Must be the GameAdmin account as defined in the LuckyColorMatch contract.
transaction {

    // This transaction does not require arguments as it operates on the current active round.

    /// Prepare phase: This phase is executed before the `execute` phase.
    /// It ensures that the signer is the GameAdmin.
    ///
    /// Parameters:
    /// - signer: The `AuthAccount` of the account that signed and submitted this transaction.
    ///           This account must be the GameAdmin.
    ///
    /// Preconditions:
    /// - The `signer`'s address must match the `LuckyColorMatch.GameAdmin` address.
    prepare(signer: AuthAccount) {
        // The `closeRound` function in the contract itself will check if the caller is the admin
        // and if there's an active round to close.
        // We add an explicit check here for clarity and to fail early if not admin.
        assert(signer.address == LuckyColorMatch.GameAdmin, message: "Only the GameAdmin can close a round.")
    }

    /// Execute phase: This phase contains the main logic of the transaction.
    /// It calls the `closeRound` public function on the `LuckyColorMatch` contract.
    /// Logs a message upon successful execution.
    execute {
        LuckyColorMatch.closeRound()
        log("Current game round closed by admin: ".concat(signer.address.toString()).concat(". VRF request initiated."))
    }
}