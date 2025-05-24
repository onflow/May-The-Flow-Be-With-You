import NonFungibleToken from 0x631e88ae7f1d7c20
import EvolvingCreaturesV2 from 0x2444e6b4d9327f09 // Dirección correcta para la V2

// This transaction sets up a user's account to hold EvolvingCreaturesV2 NFTs.
// It creates a new empty Collection and stores it in account storage.
// It also links the Collection's public capabilities.

transaction {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue, UnpublishCapability, PublishCapability) &Account) {
        // Check if the account already has a Collection
        if signer.storage.borrow<&EvolvingCreaturesV2.Collection>(from: EvolvingCreaturesV2.CollectionStoragePath) != nil {
            log("Account already has an EvolvingCreaturesV2 Collection.")
            return
        }

        // Create a new empty Collection and save it to storage
        let collection <- EvolvingCreaturesV2.createEmptyCollection()
        signer.storage.save(<-collection, to: EvolvingCreaturesV2.CollectionStoragePath)
        log("EvolvingCreaturesV2 Collection created and saved.")

        // Create a public capability for the Collection
        // Note: EvolvingCreaturesCollectionPublic should be an interface that includes NonFungibleToken.CollectionPublic
        // and any other public functions specific to the EvolvingCreatures collection.
        // For now, we assume EvolvingCreatures.Collection resource directly implements these or
        // that EvolvingCreatures.CollectionPublicPath expects the concrete type if no separate public interface is defined yet.

        // Unpublish any existing capability at the public path first
        signer.capabilities.unpublish(EvolvingCreaturesV2.CollectionPublicPath)

        // Publish the new capability
        let cap = signer.capabilities.storage.issue<&EvolvingCreaturesV2.Collection>(EvolvingCreaturesV2.CollectionStoragePath)
        signer.capabilities.publish(cap, at: EvolvingCreaturesV2.CollectionPublicPath)
        
        log("Published EvolvingCreaturesV2 Collection capability to public path.")
    }

    execute {
        log("Account setup complete for EvolvingCreaturesV2.")
    }
} 