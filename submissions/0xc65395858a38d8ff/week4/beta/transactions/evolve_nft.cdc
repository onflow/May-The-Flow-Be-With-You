// evolve_nft.cdc
// Transaction to evolve an NFT's traits

import "EvolvingNFT"
import "NonFungibleToken"

transaction(nftID: UInt64, evolutionSeed: UInt64) {
    
    let collectionRef: auth(NonFungibleToken.Update) &EvolvingNFT.Collection
    
    prepare(signer: &Account) {
        // Get the signer's collection reference with update permissions
        self.collectionRef = signer.storage.borrow<auth(NonFungibleToken.Update) &EvolvingNFT.Collection>(from: EvolvingNFT.CollectionStoragePath)
            ?? panic("Could not borrow collection reference")
    }
    
    execute {
        // Get current traits before evolution
        if let nftRef = self.collectionRef.borrowEvolvingNFT(id: nftID) {
            log("=== BEFORE EVOLUTION ===")
            if let colorDisplay = nftRef.getTraitDisplay(traitType: "color") {
                log("Color: ".concat(colorDisplay))
            }
            if let sizeDisplay = nftRef.getTraitDisplay(traitType: "size") {
                log("Size: ".concat(sizeDisplay))
            }
            
            // Trigger evolution
            self.collectionRef.evolveNFT(id: nftID, seed: evolutionSeed)
            
            log("=== AFTER EVOLUTION ===")
            if let colorDisplay = nftRef.getTraitDisplay(traitType: "color") {
                log("Color: ".concat(colorDisplay))
            }
            if let sizeDisplay = nftRef.getTraitDisplay(traitType: "size") {
                log("Size: ".concat(sizeDisplay))
            }
            
            log("Evolution completed!")
        } else {
            panic("NFT not found!")
        }
    }
} 