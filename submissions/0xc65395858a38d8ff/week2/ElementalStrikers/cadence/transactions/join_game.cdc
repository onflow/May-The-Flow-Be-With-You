// transactions/join_game.cdc
// Allows a player to join an existing game in ElementalStrikers by staking FLOW.

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from 0xElementalStrikers_ADDRESS

transaction(gameId: UInt64, stakeAmount: UFix64) {

    // The Vault resource that holds the FLOW tokens to be staked by the joining player
    let stakeVault: @{FungibleToken.Vault}
    // Reference to the signer's PlayerAgent resource
    let playerAgentRef: &ElementalStrikers.PlayerAgent
    let playerAddress: Address // To hold the signer's address

    prepare(signer: auth(BorrowValue, Storage, Capabilities) &Account) {
        // 1. Get a reference to the signer's main FlowToken Vault.
        let mainFlowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow a reference to the signer's FlowToken Vault. Make sure it exists at /storage/flowTokenVault.")

        // 2. Withdraw the stake amount from the main vault
        // The contract's joinGame function will verify if this stakeAmount matches the game's required stake.
        self.stakeVault <- mainFlowVault.withdraw(amount: stakeAmount)

        // 3. Borrow a reference to the signer's PlayerAgent.
        self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")

        // 4. Get the signer's address
        self.playerAddress = signer.address
        
        log("Prepared to join game. Stake withdrawn. Player address captured.")
    }

    execute {
        // 5. Call the joinGame function on the ElementalStrikers contract
        ElementalStrikers.joinGame(
            gameId: gameId,
            player2Address: self.playerAddress, // Pass the signer's address
            player2StakeVault: <-self.stakeVault
            // The stakeAmount is implicitly checked by the contract against game.stakeAmount using player2StakeVault.balance
        )
        log("Successfully joined game with ID: ".concat(gameId.toString()).concat(" by staking: ").concat(stakeAmount.toString()).concat(" as player ").concat(self.playerAddress.toString()))
    }
} 