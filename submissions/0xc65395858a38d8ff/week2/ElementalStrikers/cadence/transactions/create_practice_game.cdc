// transactions/create_practice_game.cdc
// Allows a player to create a new PvE (practice) game in ElementalStrikers.

import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

transaction(player1Choice: String) {

    // Reference to the signer's PlayerAgent resource, to get their address
    // and to potentially call practice game creation through agent in future.
    let playerAgentRef: &ElementalStrikers.PlayerAgent
    let playerAddress: Address

    prepare(signer: auth(BorrowValue) &Account) {
        self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        
        self.playerAddress = signer.address
        log("PlayerAgent borrowed, player address obtained.")
    }

    execute {
        let gameId = ElementalStrikers.createPracticeGame(
            player1Address: self.playerAddress,
            player1Choice: player1Choice
        )
        log("Practice game created with ID: ".concat(gameId.toString()).concat(" for player ").concat(self.playerAddress.toString()).concat(" with choice: ".concat(player1Choice)))
        log("This game is now awaiting randomness. Call 'reveal_outcome' transaction to see the result.")
    }
} 