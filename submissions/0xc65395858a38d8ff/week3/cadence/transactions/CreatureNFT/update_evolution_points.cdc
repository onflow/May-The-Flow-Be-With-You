import "NonFungibleToken"
import "CreatureNFT"

// This transaction updates the evolution points (puntosEvolucion) of a specific CreatureNFT.
// The transaction must be signed by the owner of the NFT.

transaction(nftID: UInt64, newPuntosEvolucion: UFix64) {

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
        // Update the evolution points
        self.nftRef.updatePuntosEvolucion(newEP: newPuntosEvolucion)
        log("NFT ID: ".concat(nftID.toString()).concat(" evolution points updated to: ").concat(newPuntosEvolucion.toString()))
    }
} 