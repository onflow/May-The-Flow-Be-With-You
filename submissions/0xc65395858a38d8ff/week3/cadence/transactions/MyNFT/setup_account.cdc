import "NonFungibleToken"
import "MyNFT"
import "MetadataViews"

// This transaction sets up an account to receive MyNFTs.
// It creates a new empty Collection and publishes a capability
// to the Collection, allowing others to deposit MyNFTs to it.

transaction {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        // Check if the account already has a MyNFT Collection
        if signer.storage.borrow<&MyNFT.Collection>(from: MyNFT.CollectionStoragePath) != nil {
            log("Account already has a MyNFT Collection.")
            return
        }

        // Create a new empty Collection resource
        let collection <- MyNFT.createEmptyCollection(nftType: Type<@MyNFT.NFT>())

        // Save the Collection to the account's storage
        signer.storage.save(<-collection, to: MyNFT.CollectionStoragePath)
        log("MyNFT Collection saved to storage.")

        // Create a public capability for the Collection
        // so that others can deposit MyNFTs to it.
        let collectionCap = signer.capabilities.storage.issue<&MyNFT.Collection>(MyNFT.CollectionStoragePath)
        signer.capabilities.publish(collectionCap, at: MyNFT.CollectionPublicPath)
        log("MyNFT Collection capability published.")
    }

    execute {
        log("Account setup complete for MyNFTs.")
    }
} 