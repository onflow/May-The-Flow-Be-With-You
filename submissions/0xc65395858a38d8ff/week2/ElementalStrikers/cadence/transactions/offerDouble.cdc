import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from 0xElementalStrikers_ADDRESS

transaction(gameId: UInt64) {

    let gameRef: &ElementalStrikers.Game?
    let angebotenVonAddress: Address
    let requiredBalance: UFix64

    prepare(signer: auth(BorrowValue) &Account) {
        self.angebotenVonAddress = signer.address

        let game: &ElementalStrikers.Game = ElementalStrikers.borrowGame(gameId: gameId)
            ?? panic("Game not found")
        
        self.gameRef = game 

        assert(self.gameRef!.status == ElementalStrikers.GameStatus.awaitingDoubleOffer, 
               message: "Game is not awaiting a double offer.")

        assert(self.angebotenVonAddress == self.gameRef!.lastRoundLoser, 
               message: "Only the loser of the game can offer to double.")

        self.requiredBalance = self.gameRef!.currentStakeAmount 

        let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the signer's FlowToken vault")

        assert(vaultRef.balance >= self.requiredBalance,
               message: "Signer does not have enough FlowToken to cover the additional stake for doubling. Required: ".concat(self.requiredBalance.toString()).concat(", Available: ").concat(vaultRef.balance.toString()))
    }

    execute {
        self.gameRef!.offerDoubleOrNothing(offererAddress: self.angebotenVonAddress)
        
        log("Transaction to offer double for game ".concat(gameId.toString()).concat(" by ").concat(self.angebotenVonAddress.toString()).concat(" submitted successfully."))
    }
} 