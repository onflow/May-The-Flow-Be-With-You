// transactions/make_move.cdc
// Allows a player in a game to make their elemental move.

import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

transaction(gameId: UInt64, element: String) {

    // Reference to the signer's PlayerAgent resource
    let playerAgentRef: &ElementalStrikers.PlayerAgent

    prepare(signer: auth(BorrowValue) &Account) {
        self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        
        log("PlayerAgent borrowed.")
    }

    execute {
        self.playerAgentRef.makeMove(gameId: gameId, element: element)
        log("makeMove called for game ID: ".concat(gameId.toString()).concat(" with element: ".concat(element)))
        
        // Check game status after move to inform user if it's awaiting reveal
        let gameDetails = self.playerAgentRef.getGameDetails(gameId: gameId)
        if let details = gameDetails {
            log("Game status after move: ".concat(details.status.toString()))
            if details.status == ElementalStrikers.GameStatus.awaitingRandomness {
                log("Game is now awaiting randomness. Call 'reveal_outcome' transaction after block ".concat(details.committedBlockHeight!.toString()).concat(" has passed."))
            }
        }
    }
} 