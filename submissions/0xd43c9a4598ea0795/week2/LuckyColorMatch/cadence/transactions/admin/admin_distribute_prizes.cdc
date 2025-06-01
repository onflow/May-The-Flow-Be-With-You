/// @title Admin Distribute Prizes Transaction
/// @author Rooroo Documenter
/// @notice This transaction allows the designated GameAdmin to initiate the prize
/// calculation and distribution process for a specific game round. This should be
/// called after a round has been closed, the VRF callback has been received,
/// and the lucky combination has been determined (i.e., round status is 'CalculatingWinners').
/// It calls the `calculateAndDistributePrizes` function in the `LuckyColorMatch` contract.

import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc" /// Imports the LuckyColorMatch contract.

/// Transaction definition for distributing prizes for a completed game round.
/// Signer: Must be the GameAdmin account as defined in the LuckyColorMatch contract.
///
/// Parameters:
/// - roundID: The `UInt64` ID of the game round for which to distribute prizes.
transaction(roundID: UInt64) {

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
        // The `calculateAndDistributePrizes` function in the contract itself will check
        // if the caller is the admin and if the round is in the correct state.
        // We add an explicit check here for clarity and to fail early if not admin.
        assert(signer.address == LuckyColorMatch.GameAdmin, message: "Only the GameAdmin can distribute prizes.")
    }

    /// Execute phase: This phase contains the main logic of the transaction.
    /// It calls the `calculateAndDistributePrizes` public function on the `LuckyColorMatch` contract
    /// for the specified `roundID`.
    /// Logs a message upon successful execution.
    execute {
        LuckyColorMatch.calculateAndDistributePrizes(roundID: roundID)
        log("Prize calculation and distribution triggered by admin ".concat(signer.address.toString()).concat(" for round: ").concat(roundID.toString()))
    }
}