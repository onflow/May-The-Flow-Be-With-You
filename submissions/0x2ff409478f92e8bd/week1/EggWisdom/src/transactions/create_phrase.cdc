import "EggWisdom"
import "NonFungibleToken"
import "MetadataViews"
import "FlowToken"
import "FungibleToken"
import "Zen"
// This transaction is for the admin to create a new phrase struct
// and store it in the EggWisdom smart contract

transaction(
    phrase: String,
    base64Img: String,
    namesOnScreen: [String],
    catsOnScreen: [String],
    background: String) {

    prepare(signer: auth(BorrowValue, SaveValue, Capabilities) &Account) {
        let collectionData = EggWisdom.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // Check if the account already has a collection
        if signer.storage.borrow<&EggWisdom.Collection>(from: collectionData.storagePath) == nil {
            // Create a new empty collection
            let collection <- EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
            // save it to the account
            signer.storage.save(<-collection, to: collectionData.storagePath)
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

        let newPhraseID = EggWisdom.createPhrase(
            phrase: phrase,
            base64Img: base64Img,
            namesOnScreen: namesOnScreen,
            catsOnScreen: catsOnScreen,
            background: background,
            uploader: signer.address,
            payment: <- vaultRef.withdraw(amount: 5.0)
            )
    }
    execute {   
    }
}