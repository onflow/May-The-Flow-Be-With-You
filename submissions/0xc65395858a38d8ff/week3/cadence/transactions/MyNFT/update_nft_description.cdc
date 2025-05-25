import "NonFungibleToken"
import "MyNFT"

// This transaction updates the description of a specific MyNFT.
// The transaction must be signed by the owner of the NFT.

transaction(nftID: UInt64, newDescription: String) {

    // Reference to the NFT resource that will be updated
    // We need auth access to call the updateDescription function
    let nftRef: &MyNFT.NFT

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the signer's Collection
        let collectionRef = signer.storage.borrow<&MyNFT.Collection>(from: MyNFT.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's Collection. Make sure the account is set up and owns NFTs.")

        // Borrow a reference to the NFT to be updated
        // We borrow it as &MyNFT.NFT to access the custom updateDescription function
        let borrowedNFT = collectionRef.borrowNFT(nftID)
            ?? panic("Could not borrow NFT with ID ".concat(nftID.toString()).concat(" from collection."))

        self.nftRef = borrowedNFT as! &MyNFT.NFT // Force downcast after successful borrow
    }

    execute {
        // Update the description
        self.nftRef.updateDescription(newDescription: newDescription)
        log("NFT ID: ".concat(nftID.toString()).concat(" description updated to: '").concat(newDescription).concat("'."))
    }
} 