import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from 0xElementalStrikers_ADDRESS

// Transaction for a player to respond to a double offer.
// If accepted, both players must provide their additional stake.
// The 'offererAdditionalVault' is from the player who made the double offer.
// The 'responderAdditionalVault' is from the player signing this transaction (who is responding).
transaction(gameId: UInt64, acceptDecision: Bool) {

    let responderAddress: Address

    prepare(signer: auth(BorrowValue) &Account) {
        self.responderAddress = signer.address

        // Minimal checks here, most are in the contract function now.
        // We still need to borrow the game to ensure it exists before calling contract.
        let gameRef = ElementalStrikers.borrowGame(gameId: gameId)
            ?? panic("Game not found in transaction prepare phase.")
        
        // We can assert the status here if we want to give an early error before calling contract.
        assert(gameRef.status == ElementalStrikers.GameStatus.awaitingDoubleResponse,
               message: "Transaction: Game is not awaiting a response to a double offer.")
    }

    execute {
        ElementalStrikers.respondToDoubleOffer(
            gameId: gameId, 
            responderAddress: self.responderAddress, 
            accept: acceptDecision
        )
        
        if acceptDecision {
            log("Transaction to ACCEPT double offer for game ".concat(gameId.toString()).concat(" submitted by ").concat(self.responderAddress.toString()))
        } else {
            log("Transaction to REJECT double offer for game ".concat(gameId.toString()).concat(" submitted by ").concat(self.responderAddress.toString()))
        }
    }
} 