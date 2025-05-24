import NonFungibleToken from 0x631e88ae7f1d7c20
import EvolvingCreatures from 0x2444e6b4d9327f09

// This transaction sets up a user's account to hold EvolvingCreatures NFTs.
// It creates a new empty Collection and stores it in account storage.
// It also links the Collection's public capabilities.

transaction {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue, Capabilities, PublishCapability, UnpublishCapability) &Account) {
        // Paths
        let storagePath: StoragePath = /storage/EvolvingCreaturesCollectionV2
        let publicPath: PublicPath = /public/EvolvingCreaturesCollectionPublicV2
        
        // Check if already exists
        if signer.storage.borrow<&EvolvingCreatures.Collection>(from: storagePath) != nil {
            log("Collection already exists")
            return
        }
        
        // Create a new collection using createEmptyCollection with the correct parameter
        let newCollection <- EvolvingCreatures.createEmptyCollection(nftType: Type<@EvolvingCreatures.NFT>())
        
        // Save the collection
        signer.storage.save(<-newCollection, to: storagePath)
        
        // Create public capability
        let cap = signer.capabilities.storage.issue<&EvolvingCreatures.Collection{NonFungibleToken.CollectionPublic, EvolvingCreatures.EvolvingCreaturesCollectionPublic}>(storagePath)
        signer.capabilities.publish(cap, at: publicPath)
        
        log("Setup complete!")
    }

    execute {
        log("Account setup complete for EvolvingCreatures.")
    }
} 