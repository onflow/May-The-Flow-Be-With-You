// setup_collection.cdc
// Transaction to set up an NFT collection for a user

import "EvolvingNFT"
import "NonFungibleToken"

transaction() {
    
    prepare(signer: &Account) {
        // Check if collection already exists
        if signer.storage.borrow<&EvolvingNFT.Collection>(from: EvolvingNFT.CollectionStoragePath) == nil {
            // Create a new collection
            let collection <- EvolvingNFT.createEmptyCollection(nftType: Type<@EvolvingNFT.NFT>())
            
            // Save it to storage
            signer.storage.save(<-collection, to: EvolvingNFT.CollectionStoragePath)
            
            // Create a public capability for the collection
            let collectionCapability = signer.capabilities.storage.issue<&{NonFungibleToken.Collection}>(EvolvingNFT.CollectionStoragePath)
            signer.capabilities.publish(collectionCapability, at: EvolvingNFT.CollectionPublicPath)
            
            log("Collection set up successfully!")
        } else {
            log("Collection already exists!")
        }
    }
    
    execute {
        // Verify collection is accessible
        let collectionRef = getAccount(signer.address)
            .capabilities.borrow<&{NonFungibleToken.Collection}>(EvolvingNFT.CollectionPublicPath)
            ?? panic("Could not borrow collection reference")
        
        log("Collection verified! Current NFT count: ".concat(collectionRef.getIDs().length.toString()))
    }
} 