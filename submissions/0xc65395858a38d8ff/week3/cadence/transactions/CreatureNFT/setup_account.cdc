import "NonFungibleToken"
import "CreatureNFT"
import "MetadataViews"

// This transaction sets up an account to receive CreatureNFTs.
// It creates a new empty Collection and publishes a capability
// to the Collection, allowing others to deposit CreatureNFTs to it.

transaction {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        // Check if the account already has a CreatureNFT Collection
        if signer.storage.borrow<&CreatureNFT.Collection>(from: CreatureNFT.CollectionStoragePath) != nil {
            log("Account already has a CreatureNFT Collection.")
            return
        }

        // Create a new empty Collection resource
        let collection <- CreatureNFT.createEmptyCollection(nftType: Type<@CreatureNFT.NFT>())

        // Save the Collection to the account's storage
        signer.storage.save(<-collection, to: CreatureNFT.CollectionStoragePath)
        log("CreatureNFT Collection saved to storage.")

        // Create a public capability for the Collection
        // so that others can deposit CreatureNFTs to it.
        let collectionCap = signer.capabilities.storage.issue<&CreatureNFT.Collection>(CreatureNFT.CollectionStoragePath)
        signer.capabilities.publish(collectionCap, at: CreatureNFT.CollectionPublicPath)
        log("CreatureNFT Collection capability published.")
    }

    execute {
        log("Account setup complete for CreatureNFTs.")
    }
} 