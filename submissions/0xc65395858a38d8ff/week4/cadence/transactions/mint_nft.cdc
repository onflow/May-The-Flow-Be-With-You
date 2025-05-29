// mint_nft.cdc
// Transaction to mint an NFT with modular traits

import "EvolvingNFT"
import "ColorModule"
import "SizeModule"
import "NonFungibleToken"

transaction(recipient: Address, name: String, description: String) {
    
    let minterRef: &EvolvingNFT.NFTMinter
    let recipientCollectionRef: &{NonFungibleToken.Collection}
    
    prepare(signer: &Account) {
        // Get minter reference
        self.minterRef = signer.storage.borrow<&EvolvingNFT.NFTMinter>(from: EvolvingNFT.MinterStoragePath)
            ?? panic("Could not borrow minter reference")
        
        // Get recipient's collection reference
        self.recipientCollectionRef = getAccount(recipient)
            .capabilities.borrow<&{NonFungibleToken.Collection}>(EvolvingNFT.CollectionPublicPath)
            ?? panic("Could not borrow recipient's collection reference")
    }
    
    execute {
        // Create traits using the module factories
        let traits: @{String: {TraitModule.Trait}} <- {}
        
        // Create a color trait (default Red)
        let colorTrait <- ColorModule.createDefaultTrait()
        let oldColorTrait <- traits["color"] <- colorTrait
        destroy oldColorTrait
        
        // Create a size trait (default Medium - size 5)
        let sizeTrait <- SizeModule.createDefaultTrait()
        let oldSizeTrait <- traits["size"] <- sizeTrait
        destroy oldSizeTrait
        
        // Mint the NFT with traits
        let nft <- self.minterRef.mintNFT(
            name: name,
            description: description,
            traits: <- traits
        )
        
        // Deposit to recipient's collection
        self.recipientCollectionRef.deposit(token: <- nft)
        
        log("NFT minted successfully with modular traits!")
    }
} 