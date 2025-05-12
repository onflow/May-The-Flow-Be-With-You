import "EggWisdom"
import "NonFungibleToken"
import "MetadataViews"
import "FlowToken"
import "FungibleToken"
import "Zen"
// This transaction is for minting an EggWisdom NFT
transaction(amount: Int) {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        let collectionData = EggWisdom.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // Check if the account already has a collection
        if signer.storage.borrow<&EggWisdom.Collection>(from: collectionData.storagePath) == nil {
            // Create a new empty collection
            let collection <- EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
            // save it to the account
            signer.storage.save(<-collection, to: collectionData.storagePath)
            // the old "unlink"
            let oldLink = signer.capabilities.unpublish(collectionData.publicPath)
            // create a public capability for the collection
            let collectionCap = signer.capabilities.storage.issue<&EggWisdom.Collection>(collectionData.storagePath)
            signer.capabilities.publish(collectionCap, at: collectionData.publicPath)
        }
        // Check if the account already has a receipt storage
        if signer.storage.type(at: EggWisdom.EggStoragePath) == nil {
            let storage <- EggWisdom.createEmptyEggStorage()
            signer.storage.save(<- storage, to: EggWisdom.EggStoragePath)
            // create a public capability for the storage
            let storageCap = signer.capabilities.storage.issue<&EggWisdom.EggStorage>(EggWisdom.EggStoragePath)
            signer.capabilities.publish(storageCap, at: EggWisdom.EggStoragePublicPath)
        }
        // Check if the account already Zen setup
        if signer.storage.borrow<&Zen.Vault>(from: Zen.TokenStoragePath) == nil {
            // Create a new empty collection
            let vault <- Zen.createEmptyVault(vaultType: Type<@Zen.Vault>())
            // save it to the account
            signer.storage.save(<-vault, to: Zen.TokenStoragePath)
            // Create a public capability to the stored Vault that only exposes
            // the `deposit` method through the `Receiver` interface
            var capability_1 = signer.capabilities.storage.issue<&Zen.Vault>(Zen.TokenStoragePath)
            signer.capabilities.publish(capability_1, at: Zen.TokenPublicReceiverPath)
            
            // Create a public capability to the stored Vault that only exposes
            // the `balance` field through the `Balance` interface
            var capability_2 = signer.capabilities.storage.issue<&Zen.Vault>(Zen.TokenStoragePath)
            signer.capabilities.publish(capability_2, at: Zen.TokenPublicBalancePath)
        }
        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("The signer does not store a FlowToken Vault object at the path "
                    .concat("/storage/flowTokenVault. ")
                    .concat("The signer must initialize their account with this vault first!"))

        // get ref to EggStorage
        let storageRef = signer.storage.borrow<&EggWisdom.EggStorage>(from: EggWisdom.EggStoragePath)
            ?? panic("Cannot borrow a reference to the recipient's EggWisdom EggStorage")
        
                var counter = 0

        while counter < amount {
            // Mint Wisdom
            storageRef.mintEgg(recipient: signer.address, payment: <- vaultRef.withdraw(amount: 1.0))

            counter = counter + 1
        }

    }
    execute {

    }
}