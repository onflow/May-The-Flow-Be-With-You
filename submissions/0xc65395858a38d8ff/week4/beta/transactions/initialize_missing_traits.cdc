// initialize_missing_traits.cdc
// Transaction to initialize missing traits for existing NFTs (Lazy Initialization)

import "EvolvingNFT"
import "NonFungibleToken"

transaction(nftID: UInt64) {
    
    let collectionRef: &EvolvingNFT.Collection
    
    prepare(signer: &Account) {
        // Get reference to the signer's collection
        self.collectionRef = signer.storage.borrow<&EvolvingNFT.Collection>(from: EvolvingNFT.CollectionStoragePath)
            ?? panic("Could not borrow collection reference from storage")
    }
    
    execute {
        // Get the NFT reference
        let nftRef = self.collectionRef.borrowEvolvingNFT(id: nftID)
            ?? panic("Could not borrow NFT reference")
        
        // Get all registered modules
        let registeredModules = EvolvingNFT.getRegisteredModules()
        
        log("🚀 Initializing missing traits for NFT #".concat(nftID.toString()))
        log("Registered modules: ".concat(registeredModules.length.toString()))
        
        var traitsInitialized = 0
        
        for moduleType in registeredModules {
            // 🚀 LAZY INITIALIZATION: Ensure trait exists
            if nftRef.ensureTraitExists(traitType: moduleType) {
                if let display = nftRef.getTraitDisplay(traitType: moduleType) {
                    log("✅ ".concat(moduleType).concat(": ").concat(display))
                    traitsInitialized = traitsInitialized + 1
                }
            }
        }
        
        log("🎉 Traits initialized: ".concat(traitsInitialized.toString()).concat("/").concat(registeredModules.length.toString()))
    }
} 