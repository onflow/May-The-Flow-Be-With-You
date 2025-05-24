// transactions/create_game.cdc
// Allows a player to create a new game in ElementalStrikers by staking FLOW.

import FungibleToken from 0x9a0766d93b6608b7 // FungibleToken standard address for Testnet
import FlowToken from 0x7e60df042a9c0868     // FlowToken standard address for Testnet
import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

transaction(stakeAmount: UFix64) {

    // The Vault resource that holds the FLOW tokens to be staked
    let stakeVault: @FungibleToken.Vault
    // Capability to the signer's PlayerAgent resource
    let playerAgentRef: &ElementalStrikers.PlayerAgent

    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        // 1. Get a reference to the signer's main FlowToken Vault.
        // Assumes the vault is at the standard FlowToken path.
        let mainFlowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow a reference to the signer's FlowToken Vault. Make sure it exists at /storage/flowTokenVault.")

        // 2. Withdraw the stake amount from the main vault
        self.stakeVault <- mainFlowVault.withdraw(amount: stakeAmount)

        // 3. Borrow a reference to the signer's PlayerAgent.
        // This isn't strictly needed for creating a game directly via the contract function,
        // but good practice if game creation was part of the PlayerAgent interface.
        // For now, we'll keep it to show how one might borrow it, though it's unused in the execute phase for this tx.
        self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        
        log("Prepared for game creation. Stake withdrawn.")
    }

    execute {
        // 4. Call the createGame function on the ElementalStrikers contract
        let gameId = ElementalStrikers.createGame(
            player1StakeVault: <-self.stakeVault,
            initialStakeAmount: stakeAmount
        )
        log("Game created with ID: ".concat(gameId.toString()).concat(" and stake: ").concat(stakeAmount.toString()))
    }
} 