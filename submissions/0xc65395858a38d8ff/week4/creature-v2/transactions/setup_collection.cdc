// Setup Collection Transaction for EvolvingCreatureNFT
import "EvolvingCreatureNFT"
import "NonFungibleToken"

transaction() {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Check if collection exists
        if acct.storage.borrow<&EvolvingCreatureNFT.Collection>(from: EvolvingCreatureNFT.CollectionStoragePath) == nil {
            // Create new empty collection
            let collection <- EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
            
            // Save collection to storage
            acct.storage.save(<-collection, to: EvolvingCreatureNFT.CollectionStoragePath)
            
            // Create public capability
            let cap = acct.capabilities.storage.issue<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionStoragePath)
            acct.capabilities.publish(cap, at: EvolvingCreatureNFT.CollectionPublicPath)
            
            log("EvolvingCreatureNFT Collection setup complete")
        } else {
            log("Collection already exists")
        }
    }
} 