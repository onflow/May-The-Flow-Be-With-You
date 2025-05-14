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

            // Increment currentMaxWins as per new requirement
            self.gameRef.currentMaxWins = self.gameRef.currentMaxWins + 1

            self.gameRef.doubleOfferedBy = nil // Clear the offer
            self.gameRef.advanceRound() // Advances to the next round, resets moves, updates status, increments currentRound

            emit ElementalStrikers.DoubleOfferResponded(gameId: gameId, accepted: true, newTotalStakePerPlayer: self.gameRef.currentStakeAmount)
            log("Player ".concat(self.responderAddress.toString()).concat(" accepted the double offer for game ".concat(gameId.toString()).concat(". New stake per player: ").concat(self.gameRef.currentStakeAmount.toString()).concat(". New max wins: ").concat(self.gameRef.currentMaxWins.toString()).concat(". Advancing to round: ").concat(self.gameRef.currentRound.toString()))
        } else {
            // Double offer rejected. Game ends. Offerer (last game loser) loses the game definitively.
            // Responder (last game winner) wins the current total stake that was on the line.
            let winnerAddress = self.responderAddress // This is gameRef.lastRoundWinner from the previous game-ending state
            let loserAddress = offerer             // This is gameRef.lastRoundLoser from the previous game-ending state
            let totalWinnings = self.gameRef.currentStakeAmount * 2.0 // Total pot based on stake *per player* before this rejected double attempt

            emit ElementalStrikers.GameForfeitedByRejectingDouble(gameId: gameId, winner: winnerAddress, loser: loserAddress, winnings: totalWinnings)

            // Call finalizeResolution from the contract to handle payouts and event emission
            self.gameRef.finalizeResolution(
                environmentalModifier: self.gameRef.finalEnvironmentalModifier ?? "N/A",
                criticalHitTypeP1: self.gameRef.finalCriticalHitTypePlayer1 ?? "N/A",
                criticalHitTypeP2OrComputer: self.gameRef.finalCriticalHitTypeP2OrComputer ?? "N/A",
                winnerAddress: winnerAddress,
                loserAddress: loserAddress,
                winningsToWinner: totalWinnings,
                computerGeneratedMove: self.gameRef.computerMove ?? "N/A"
            )
            
            log("Player ".concat(self.responderAddress.toString()).concat(" rejected the double offer for game ".concat(gameId.toString()).concat(". Player ".concat(loserAddress.toString()).concat(" forfeits. Winner: ").concat(winnerAddress.toString()).concat(". Winnings: ").concat(totalWinnings.toString()))

            // The vaults passed as parameters (offererAdditionalVault, responderAdditionalVault) are destroyed in the prepare block for the reject case.
            // finalizeResolution handles the game's internal vaults (player1Vault, player2Vault, and any existing ExtraStakeVaults from *previous* doubles).

            self.gameRef.doubleOfferedBy = nil // Clear the offer details
        }
    }
} 