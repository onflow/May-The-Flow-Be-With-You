// transactions/reveal_outcome.cdc
// Allows a player to trigger the reveal phase of a game in ElementalStrikers.

import ElementalStrikers from 0xf8d6e0586b0a20c7

transaction(gameId: UInt64) {

    // Reference to the signer's PlayerAgent resource
    let playerAgentRef: &ElementalStrikers.PlayerAgent

    prepare(signer: auth(BorrowValue) &Account) {
        self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
        ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        
        log("PlayerAgent borrowed.")
    }

    execute {
        // It's good to check the game status before attempting to reveal, 
        // though the contract itself will also have preconditions.
        let gameDetailsBefore = self.playerAgentRef.getGameDetails(gameId: gameId)
        if let details = gameDetailsBefore {
            if details.status == ElementalStrikers.GameStatus.awaitingRandomness {
                log("Attempting to reveal outcome for game ID: ".concat(gameId.toString()).concat(" committed at block: ").concat(details.committedBlockHeight!.toString()))
                self.playerAgentRef.revealOutcome(gameId: gameId)
                log("revealOutcome called for game ID: ".concat(gameId.toString()))

                let gameDetailsAfter = self.playerAgentRef.getGameDetails(gameId: gameId)
                if let detailsAfter = gameDetailsAfter {
                    log("Game status after reveal attempt: ".concat(detailsAfter.status.rawValue.toString()))
                    if detailsAfter.status == ElementalStrikers.GameStatus.resolved {
                        log("Game successfully resolved. Winner: ".concat(detailsAfter.winner?.toString() ?? "Draw/None"))
                    } else {
                        log("Game not yet resolved. Ensure committed block has passed and randomness is available.")
                    }
                }
            } else {
                log("Game ID: ".concat(gameId.toString()).concat(" is not awaiting randomness. Current status: ").concat(details.status.rawValue.toString()))
            }
        } else {
            panic("Could not retrieve game details for game ID: ".concat(gameId.toString()))
        }
    }
} 