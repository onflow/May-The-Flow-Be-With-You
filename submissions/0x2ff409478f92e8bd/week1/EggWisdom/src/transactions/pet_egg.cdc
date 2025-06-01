import "EggWisdom"
import "NonFungibleToken"
import "MetadataViews"
import "FlowToken"
import "FungibleToken"

/// Retrieves the saved Receipt and redeems it to reveal the cards
///
transaction() {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {


        let collectionData = EggWisdom.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // Check if the account already has a collection
        let ref = signer.storage.borrow<&EggWisdom.Collection>(from: collectionData.storagePath)!
        // Borrow the NFT
        let nft = ref.borrowNFT(0) as! &EggWisdom.NFT

        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("The signer does not store a FlowToken Vault object at the path "
                    .concat("/storage/flowTokenVault. ")
                    .concat("The signer must initialize their account with this vault first!"))

        // Mint Wisdom
        let pet = nft.petEgg(payment: <- vaultRef.withdraw(amount: 0.01))
        
    }
}