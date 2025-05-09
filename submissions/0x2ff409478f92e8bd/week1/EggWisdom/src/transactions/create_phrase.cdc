import "EggWisdom"
import "NonFungibleToken"
import "MetadataViews"
import "FlowToken"
import "FungibleToken"
// This transaction is for the admin to create a new phrase struct
// and store it in the EggWisdom smart contract

transaction(
    phrase: String,
    base64Img: String,
    namesOnScreen: [String],
    catsOnScreen: [String],
    background: String) {

    prepare(signer: auth(BorrowValue, SaveValue) &Account) {
        let collectionData = EggWisdom.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // Check if the account already has a collection
        if signer.storage.borrow<&EggWisdom.Collection>(from: collectionData.storagePath) == nil {
            // Create a new empty collection
            let collection <- EggWisdom.createEmptyCollection(nftType: Type<@EggWisdom.NFT>())
            // save it to the account
            signer.storage.save(<-collection, to: collectionData.storagePath)
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
            payment: <- vaultRef.withdraw(amount: 1.0)
            )
    }
    execute {   
    }
}