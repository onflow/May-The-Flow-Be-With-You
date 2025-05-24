import "NonFungibleToken"
import "CreatureNFT"

// This transaction updates the age of a specific CreatureNFT.
// The transaction must be signed by the owner of the NFT.

transaction(nftID: UInt64, newAgeDays: UFix64) {

    // Reference to the NFT resource that will be updated
    let nftRef: &CreatureNFT.NFT

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the signer's Collection
        let collectionRef = signer.storage.borrow<&CreatureNFT.Collection>(from: CreatureNFT.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's Collection. Make sure the account is set up and owns NFTs.")

        // Borrow a reference to the NFT to be updated
        let borrowedNFT = collectionRef.borrowCreatureNFT(id: nftID)
            ?? panic("Could not borrow CreatureNFT with ID ".concat(nftID.toString()).concat(" from collection."))

        self.nftRef = borrowedNFT
    }

    execute {
        // Update the age
        self.nftRef.updateEdad(newEdad: newAgeDays)
        
        // Check if the creature has reached the end of its lifespan
        if newAgeDays >= self.nftRef.lifespanTotalSimulatedDays && self.nftRef.estaViva {
            // The creature has reached the end of its lifespan, mark it as not living
            self.nftRef.updateVitalStatus(
                newEstaViva: false, 
                newDeathBlock: getCurrentBlock().height, 
                newDeathTimestamp: getCurrentBlock().timestamp
            )
            log("Creature has reached the end of its lifespan and is no longer alive.")
        }
        
        // Update the last evolution processed information
        self.nftRef.setLastEvolutionProcessed(
            blockHeight: getCurrentBlock().height,
            timestamp: getCurrentBlock().timestamp
        )
        
        log("NFT ID: ".concat(nftID.toString()).concat(" age updated to: ").concat(newAgeDays.toString()).concat(" days"))
    }
} 