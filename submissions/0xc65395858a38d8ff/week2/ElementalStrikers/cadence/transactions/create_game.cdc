// transactions/create_game.cdc
// Allows a player to create a new game in ElementalStrikers by staking FLOW.

import FungibleToken from 0xee82856bf20e2aa6 
import FlowToken from 0x0ae53cb6e3f42a79
import NonFungibleToken from 0xf8d6e0586b0a20c7
import ElementalStrikers from 0xf8d6e0586b0a20c7

transaction(stakeAmount: UFix64, totalRounds: UInt64) {

    // The Vault resource that holds the FLOW tokens to be staked
    let stakeVault: @{FungibleToken.Vault}
    // Capability to the signer's PlayerAgent resource
    // let playerAgentRef: &ElementalStrikers.PlayerAgent // Not strictly needed for this tx version
    let playerAddress: Address // To hold the signer's address

    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        // 1. Get a reference to the signer's main FlowToken Vault.
        let mainFlowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow a reference to the signer's FlowToken Vault. Make sure it exists at /storage/flowTokenVault.")

        // 2. Withdraw the stake amount from the main vault
        self.stakeVault <- mainFlowVault.withdraw(amount: stakeAmount)

        // 3. Get the signer's address
        self.playerAddress = signer.address

        // 4. Borrow a reference to the signer's PlayerAgent (optional but good for consistency).
        // If createGame were part of PlayerAgent, this would be essential.
        // For now, it acts as a check that setup_account was run.
        let _ = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        
        log("Prepared for game creation. Stake withdrawn. Player address captured.")
    }

    execute {
        // 5. Call the createGame function on the ElementalStrikers contract
        let gameId = ElementalStrikers.createGame(
            player1Address: self.playerAddress, // Pass the signer's address
            player1StakeVault: <-self.stakeVault,
            initialStakeAmount: stakeAmount,
            totalRounds: totalRounds // Pass totalRounds to the contract function
        )
        log("Game created with ID: ".concat(gameId.toString()).concat(" with stake: ").concat(stakeAmount.toString()).concat(" for ").concat(totalRounds.toString()).concat(" rounds."))
    }
} 