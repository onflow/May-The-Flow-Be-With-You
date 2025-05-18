/// @title Player Submit Colors Transaction
/// @author Rooroo Documenter
/// @notice This transaction allows a player to submit their chosen colors for the
/// current active round of the LuckyColorMatch game. It requires payment of an
/// entry fee, which is withdrawn from the player's FungibleToken vault.
/// Players can optionally use a Lucky Charm NFT for potential benefits.
/// It calls the `submitColors` function in the `LuckyColorMatch` contract.

import FungibleToken from 0xFUNGIBLETOKENADDRESS /// Standard Fungible Token contract interface.
import LuckyColorMatch from "../../contracts/LuckyColorMatch.cdc" /// The main game contract.

/// Transaction definition for a player to submit their color choices.
/// Signer: The player account wishing to participate in the current round.
///
/// Parameters:
/// - chosenColors: An array of `String` representing the colors chosen by the player.
///                 The number of colors must match `LuckyColorMatch.numberOfColorsToChoose`.
/// - feeToPay: The `UFix64` amount representing the entry fee for the round. This might
///             be adjusted if a `luckyCharmID` providing a fee discount is used.
/// - luckyCharmID: An optional `UInt64` ID of a LuckyCharmNFT owned by the player.
///                 If provided and valid, it might apply benefits like fee discounts.
transaction(chosenColors: [String], feeToPay: UFix64, luckyCharmID: UInt64?) {

    /// The vault holding the fee payment, withdrawn from the signer's account.
    let feeVault: @FungibleToken.Vault

    /// Prepare phase: Executed before the `execute` phase.
    /// It withdraws the necessary `feeToPay` from the signer's FungibleToken vault.
    ///
    /// Parameters:
    /// - signer: The `AuthAccount` of the player submitting the colors.
    ///
    /// Panics if:
    /// - The signer does not have a FungibleToken vault at the standard path (`/storage/flowTokenVault`).
    /// - The signer's vault has insufficient balance to cover `feeToPay`.
    prepare(signer: AuthAccount) {
        // Borrow a reference to the signer's FungibleToken Vault.
        // Assumes the standard Flow token vault path. This might need to be configurable
        // or use a more generic FungibleToken path if other tokens are accepted.
        let vaultRef = signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's FungibleToken Vault at /storage/flowTokenVault!")

        // Withdraw the specified fee amount.
        // The `LuckyColorMatch.submitColors` function will handle the deposit of this fee.
        self.feeVault <- vaultRef.withdraw(amount: feeToPay)
    }

    /// Execute phase: Contains the main logic of the transaction.
    /// It calls the `submitColors` public function on the `LuckyColorMatch` contract,
    /// passing the chosen colors, the fee payment vault, and any lucky charm ID.
    /// Logs a message upon successful execution.
    execute {
        LuckyColorMatch.submitColors(
            chosenColors: chosenColors,
            feePayment: <-self.feeVault,
            luckyCharmID: luckyCharmID
        )
        log("Colors submitted successfully by player: ".concat(signer.address.toString()).concat(" for round: ").concat(LuckyColorMatch.getCurrentRoundID().toString()))
    }
}