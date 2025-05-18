/// @title Transfer Fungible Tokens Transaction (Utility)
/// @author Rooroo Documenter
/// @notice This transaction is a utility for transferring FungibleTokens (e.g., FLOW)
/// from the signer's account to a specified recipient account.
/// It's typically used for testing or administrative purposes to fund accounts.
/// This transaction does NOT mint new tokens; it transfers existing ones.
/// For actual minting, the signer would need special Minter capabilities,
/// which is usually restricted to the token contract's administrator or a service account.

import FungibleToken from 0xFUNGIBLETOKENADDRESS /// Standard Fungible Token contract interface.

/// Transaction definition for transferring FungibleTokens.
/// Signer: The account from which tokens will be withdrawn.
///
/// Parameters:
/// - recipientAddress: The `Address` of the account that will receive the tokens.
/// - amount: The `UFix64` amount of tokens to transfer.
transaction(recipientAddress: Address, amount: UFix64) {

    /// A reference to the signer's FungibleToken vault from which tokens will be withdrawn.
    let senderVaultRef: &FungibleToken.Vault
    /// The `AuthAccount` object of the recipient, used to access their public receiver capability.
    let recipientAccount: AuthAccount // Changed from PublicAccount to AuthAccount to use getCapability

    /// Prepare phase: Executed before the `execute` phase.
    /// It borrows a reference to the signer's FungibleToken vault and gets the recipient's account object.
    ///
    /// Parameters:
    /// - signer: The `AuthAccount` of the sender.
    ///
    /// Panics if:
    /// - The signer does not have a FungibleToken vault at the standard path (`/storage/flowTokenVault`).
    prepare(signer: AuthAccount) {
        // Borrow a reference to the signer's FungibleToken Vault.
        // Assumes the standard FLOW token vault path.
        self.senderVaultRef = signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Signer does not have a FungibleToken Vault at /storage/flowTokenVault. Ensure the account is set up.")
        log("Borrowed reference to signer's vault.")

        // Get the AuthAccount object for the recipient.
        // This is necessary to access their public capabilities.
        self.recipientAccount = getAuthAccount(recipientAddress)
        log("Retrieved recipient account object for address: ".concat(recipientAddress.toString()))
    }

    /// Execute phase: Contains the main logic of the transaction.
    /// It withdraws the specified `amount` from the sender's vault and deposits it
    /// into the recipient's vault using their public Receiver capability.
    /// Logs a message upon successful execution.
    ///
    /// Panics if:
    /// - The recipient does not have a FungibleToken Receiver capability at the standard path (`/public/flowTokenReceiver`).
    /// - Borrowing the receiver reference from the capability fails.
    /// - The sender's vault has insufficient balance.
    execute {
        // Get the recipient's public Receiver capability.
        // Assumes the standard FLOW token receiver path.
        let receiverCap = self.recipientAccount.getCapability<&FungibleToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Recipient does not have a FungibleToken Receiver capability at /public/flowTokenReceiver. Ensure the recipient account is set up.")
        log("Retrieved recipient's receiver capability.")

        // Borrow a reference to the receiver's vault.
        let receiverRef = receiverCap.borrow()
            ?? panic("Could not borrow reference to recipient's FungibleToken Receiver from capability. Capability might be misconfigured or restricted.")
        log("Borrowed reference to recipient's receiver.")

        // Withdraw the specified amount from the sender's vault.
        let temporaryVault <- self.senderVaultRef.withdraw(amount: amount)
        log("Withdrew ".concat(amount.toString()).concat(" tokens from sender's vault."))

        // Deposit the withdrawn tokens into the recipient's vault.
        receiverRef.deposit(from: <-temporaryVault)
        log("Deposited ".concat(amount.toString()).concat(" tokens to recipient's vault: ").concat(recipientAddress.toString()))

        log("Successfully transferred ".concat(amount.toString()).concat(" FungibleTokens from ").concat(signer.address.toString()).concat(" to ").concat(recipientAddress.toString()))
    }
}