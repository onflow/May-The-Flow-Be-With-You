// transactions/transfer_flow.cdc
// A simple transaction to transfer FLOW tokens.

import FungibleToken from 0xee82856bf20e2aa6 // FungibleToken address for Emulator
import FlowToken from 0x0ae53cb6e3f42a79     // FlowToken address for Emulator

transaction(amount: UFix64, to: Address) {

    // The Vault resource that holds the FLOW tokens to be transferred
    let sentVault: @{FungibleToken.Vault}

    prepare(signer: auth(Storage, BorrowValue) &Account) {
        // Get a reference to the signer's main FlowToken Vault.
        let mainFlowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow a reference to the signer's FlowToken Vault.")

        // Withdraw the specified amount from the main vault
        self.sentVault <- mainFlowVault.withdraw(amount: amount)
    }

    execute {
        // Get the recipient's public FlowToken Receiver capability
        let recipientCapability = getAccount(to)
            .capabilities.borrow<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ) ?? panic("Could not borrow recipient's FlowToken Receiver capability.")

        // Deposit the withdrawn tokens into the recipient's vault
        recipientCapability.deposit(from: <-self.sentVault)

        log("Transferred ".concat(amount.toString()).concat(" FLOW to ").concat(to.toString()))
    }
} 