import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

// Transaction for a player to respond to a double offer.
// If accepted, both players must provide their additional stake.
// The 'offererAdditionalVault' is from the player who made the double offer.
// The 'responderAdditionalVault' is from the player signing this transaction (who is responding).
transaction(gameId: UInt64, accept: Bool, offererAdditionalVault: @{FungibleToken.Vault}, responderAdditionalVault: @{FungibleToken.Vault}?) {

    let gameRef: &ElementalStrikers.Game
    let responderAddress: Address

    prepare(signer: AuthAccount) {
        self.responderAddress = signer.address

        self.gameRef = ElementalStrikers.borrowGame(gameId: gameId)
            ?? panic("Game not found")

        assert(self.gameRef.status == ElementalStrikers.GameStatus.awaitingDoubleResponse,
               message: "Game is not awaiting a response to a double offer.")

        assert(self.gameRef.doubleOfferedBy != nil, 
               message: "No double offer is currently active for this game.")

        assert(self.responderAddress != self.gameRef.doubleOfferedBy!,
               message: "The player who offered to double cannot respond to their own offer.")
        
        // The responder must be the other player involved in the game (the one who didn't offer)
        let offerer = self.gameRef.doubleOfferedBy!
        let player1 = self.gameRef.player1
        let player2 = self.gameRef.player2
        assert( (offerer == player1 && self.responderAddress == player2) || 
                (offerer == player2 && self.responderAddress == player1),
                message: "Responder is not a valid player for this game's double offer.")

        if accept {
            assert(responderAdditionalVault != nil, message: "Responder's additional vault must be provided if accepting the double offer.")
            let requiredAdditionalAmount = self.gameRef.currentStakeAmount
            
            assert(offererAdditionalVault.balance == requiredAdditionalAmount,
                   message: "Offerer's additional vault does not contain the correct stake amount. Expected: ".concat(requiredAdditionalAmount.toString()).concat(" Got: ".concat(offererAdditionalVault.balance.toString())))
            
            let unwrappedResponderVault = responderAdditionalVault!
            assert(unwrappedResponderVault.balance == requiredAdditionalAmount,
                   message: "Responder's additional vault does not contain the correct stake amount. Expected: ".concat(requiredAdditionalAmount.toString()).concat(" Got: ".concat(unwrappedResponderVault.balance.toString())))
        } else {
            // If rejecting, the provided vaults are not used and can be destroyed safely.
            // However, offererAdditionalVault must still be passed to the transaction to be destroyed if not nil.
            destroy offererAdditionalVault
            if responderAdditionalVault != nil {
                let unwrappedResponderVault <- responderAdditionalVault!
                destroy unwrappedResponderVault
            } else {
                destroy responderAdditionalVault
            }
        }
    }

    execute {
        let offerer = self.gameRef.doubleOfferedBy!

        if accept {
            let initialStake = self.gameRef.currentStakeAmount
            self.gameRef.currentStakeAmount = initialStake * 2.0
            
            // Store the additional stake vaults
            // Determine who is player1 and player2 to correctly assign extra vaults
            if self.gameRef.player1 == offerer {
                self.gameRef.player1ExtraStakeVault <-! offererAdditionalVault
                self.gameRef.player2ExtraStakeVault <-! responderAdditionalVault
            } else {
                self.gameRef.player2ExtraStakeVault <-! offererAdditionalVault
                self.gameRef.player1ExtraStakeVault <-! responderAdditionalVault
            }

            self.gameRef.doubleOfferedBy = nil // Clear the offer
            self.gameRef.status = ElementalStrikers.GameStatus.awaitingMoves
            self.gameRef.advanceRound() // Advances to the next round, resets moves, etc.

            emit ElementalStrikers.DoubleOfferResponded(gameId: gameId, accepted: true, newTotalStakePerPlayer: self.gameRef.currentStakeAmount)
            log("Player ".concat(self.responderAddress.toString()).concat(" accepted the double offer for game ".concat(gameId.toString()).concat(". New stake per player: ").concat(self.gameRef.currentStakeAmount.toString()))
        } else {
            // Double offer rejected. Game ends. Offerer (last round loser) loses the game.
            // Responder (last round winner) wins the original stake.
            let winnerAddress = self.responderAddress
            let loserAddress = offerer
            let winnings = self.gameRef.stakeAmount * 2.0 // Based on the original stake before double offer

            // Directly manage payout and game state update here
            self.gameRef.finalWinner = winnerAddress
            // self.gameRef.finalLoser = loserAddress // Game resource doesn't have finalLoser
            self.gameRef.status = ElementalStrikers.GameStatus.resolved

            // Payout logic (simplified from finalizeResolution)
            // Transfer player1's original vault
            var p1Vault <- self.gameRef.player1Vault <- nil
            if p1Vault == nil { panic("Player 1 vault missing unexpectedly") }
            let unwrappedP1Vault <- p1Vault!

            // Transfer player2's original vault
            var p2Vault <- self.gameRef.player2Vault <- nil
            if p2Vault == nil { panic("Player 2 vault missing unexpectedly") }
            let unwrappedP2Vault <- p2Vault!

            let winnerReceiver = getAccount(winnerAddress).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                ?? panic("Cannot borrow receiver for winner")

            winnerReceiver.deposit(from: <-unwrappedP1Vault)
            winnerReceiver.deposit(from: <-unwrappedP2Vault)
            
            // Any extra vaults that were part of the unaccepted offer should be destroyed safely.
            // Here, we ensure that offererAdditionalVault and responderAdditionalVault are destroyed if they somehow persisted (though prepare should handle it)
            // This explicit destruction is more of a safeguard for the execute phase.
            // The transaction signature ensures offererAdditionalVault is passed, responderAdditionalVault is optional.

            // Destroy any extra stake vaults that might have been pre-prepared by players but are now not needed.
            // Note: `offererAdditionalVault` and `responderAdditionalVault` are parameters consumed by the transaction.
            // If they were passed to `execute` (i.e., for an `accept` path that then failed), they would need destruction here.
            // However, our `prepare` block handles their destruction for the `reject` case.
            // The extra vaults *within the game resource* (player1ExtraStakeVault, player2ExtraStakeVault) are nil at this point.

            emit ElementalStrikers.GameForfeitedByRejectingDouble(gameId: gameId, winner: winnerAddress, loser: loserAddress, winnings: winnings)
            // Emit GameResolved as well, as the game is now over.
            // Note: Some fields for GameResolved might be from the last completed round, not this forfeiture action directly.
            emit ElementalStrikers.GameResolved(
                gameId: gameId,
                mode: self.gameRef.mode.rawValue,
                winner: winnerAddress,
                loser: loserAddress,
                player1Move: self.gameRef.player1Move ?? "N/A", // Moves from last round, or N/A
                playerOrComputerMove: self.gameRef.player2Move ?? self.gameRef.computerMove ?? "N/A",
                environmentalModifier: self.gameRef.finalEnvironmentalModifier ?? "N/A",
                criticalHitTypeP1: self.gameRef.finalCriticalHitTypePlayer1 ?? "N/A",
                criticalHitTypeP2OrComputer: self.gameRef.finalCriticalHitTypeP2OrComputer ?? "N/A",
                winnings: winnings
            )
            
            log("Player ".concat(self.responderAddress.toString()).concat(" rejected the double offer for game ").concat(gameId.toString()).concat(". Player ").concat(loserAddress.toString()).concat(" forfeits. Winner: ").concat(winnerAddress.toString()).concat(". Winnings: ").concat(winnings.toString()))

            // Clean up remaining game resource fields that might hold old vault references
            var p1ExtraVault <- self.gameRef.player1ExtraStakeVault <- nil
            destroy p1ExtraVault
            var p2ExtraVault <- self.gameRef.player2ExtraStakeVault <- nil
            destroy p2ExtraVault

            self.gameRef.doubleOfferedBy = nil
        }
    }
} 