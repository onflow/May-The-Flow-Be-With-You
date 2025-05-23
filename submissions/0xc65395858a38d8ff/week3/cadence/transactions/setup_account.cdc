import NonFungibleToken from 0x631e88ae7f1d7c20
import EvolvingCreatures from 0xbeb2f48c3293e514 // Assuming EvolvingCreatures will be deployed to this address on Testnet

// This transaction sets up a user's account to hold EvolvingCreatures NFTs.
// It creates a new empty Collection and stores it in account storage.
// It also links the Collection's public capabilities.

transaction {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue) &Account) {
        // Check if the account already has a Collection
        if signer.storage.borrow<&EvolvingCreatures.Collection>(from: EvolvingCreatures.CollectionStoragePath) != nil {
            log("Account already has an EvolvingCreatures Collection.")
            return
        }

        // Create a new empty Collection and save it to storage
        let collection <- EvolvingCreatures.createEmptyCollection()
        signer.storage.save(<-collection, to: EvolvingCreatures.CollectionStoragePath)
        log("EvolvingCreatures Collection created and saved.")

        // Create a public capability for the Collection
        // Note: EvolvingCreaturesCollectionPublic should be an interface that includes NonFungibleToken.CollectionPublic
        // and any other public functions specific to the EvolvingCreatures collection.
        // For now, we assume EvolvingCreatures.Collection resource directly implements these or
        // that EvolvingCreatures.CollectionPublicPath expects the concrete type if no separate public interface is defined yet.

        // Unpublish any existing capability at the public path first
        signer.capabilities.unpublish(EvolvingCreatures.CollectionPublicPath)

        // Publish the new capability
        let cap = signer.capabilities.storage.issue<&EvolvingCreatures.Collection>(EvolvingCreatures.CollectionStoragePath)
        signer.capabilities.publish(cap, at: EvolvingCreatures.CollectionPublicPath)
        
        log("Published EvolvingCreatures Collection capability to public path.")
    }

    execute {
        log("Account setup complete for EvolvingCreatures.")
    }
} 