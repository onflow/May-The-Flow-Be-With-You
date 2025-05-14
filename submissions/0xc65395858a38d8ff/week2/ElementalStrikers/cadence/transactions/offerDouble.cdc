import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

transaction(gameId: UInt64) {

    let gameRef: &ElementalStrikers.Game?
    let angebotenVonAddress: Address
    let requiredBalance: UFix64

    prepare(signer: AuthAccount) {
        self.angebotenVonAddress = signer.address

        self.gameRef = ElementalStrikers.borrowGame(gameId: gameId)
            ?? panic("Game not found")

        assert(self.gameRef!.status == ElementalStrikers.GameStatus.awaitingDoubleOffer, 
               message: "Game is not awaiting a double offer.")

        assert(self.angebotenVonAddress == self.gameRef!.lastRoundLoser, 
               message: "Only the loser of the last round can offer to double.")

        // The player must have enough to cover their *additional* stake if accepted.
        self.requiredBalance = self.gameRef!.currentStakeAmount 

        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the signer's FlowToken vault")

        assert(vaultRef.balance >= self.requiredBalance,
               message: "Signer does not have enough FlowToken to cover the additional stake for doubling. Required: ".concat(self.requiredBalance.toString()).concat(", Available: ").concat(vaultRef.balance.toString()))
    }

    execute {
        self.gameRef!.doubleOfferedBy = self.angebotenVonAddress
        self.gameRef!.status = ElementalStrikers.GameStatus.awaitingDoubleResponse

        let newTotalStakePerPlayer = self.gameRef!.currentStakeAmount * 2.0

        emit ElementalStrikers.DoubleOffered(gameId: gameId, offeredBy: self.angebotenVonAddress, newTotalStakePerPlayer: newTotalStakePerPlayer)
        log("Player ".concat(self.angebotenVonAddress.toString()).concat(" offered to double the stake for game ").concat(gameId.toString()).concat(". New potential stake per player: ").concat(newTotalStakePerPlayer.toString()))
    }
} 