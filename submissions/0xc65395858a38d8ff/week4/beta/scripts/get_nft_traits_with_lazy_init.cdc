// get_nft_traits_with_lazy_init.cdc
// This approach combines transaction and script to enable lazy init

import "EvolvingNFT"
import "NonFungibleToken"

access(all) fun main(ownerAddress: Address, nftID: UInt64): {String: String} {
    // Get the owner's collection reference
    let collectionRef = getAccount(ownerAddress)
        .capabilities.borrow<&{NonFungibleToken.Collection}>(EvolvingNFT.CollectionPublicPath)
        ?? panic("Could not borrow collection reference")
    
    // Borrow the specific NFT
    let nftRef = collectionRef.borrowNFT(nftID)
        ?? panic("Could not borrow NFT reference")
    
    let evolvingNFTRef = nftRef as! &EvolvingNFT.NFT
    
    // Get all trait displays
    var traitDisplays: {String: String} = {}
    
    // Get ALL registered modules
    let registeredModules = EvolvingNFT.getRegisteredModules()
    
    for moduleType in registeredModules {
        // Check existing traits first (view-safe)
        if let traitDisplay = evolvingNFTRef.getTraitDisplay(traitType: moduleType) {
            traitDisplays[moduleType] = traitDisplay
        } else {
            // Trait doesn't exist yet - indicate it needs lazy init
            if EvolvingNFT.getModuleFactory(moduleType: moduleType) != nil {
                traitDisplays[moduleType] = "⏳ Trait needs initialization - call transaction first"
            }
        }
    }
    
    // Add basic NFT info
    traitDisplays["id"] = nftID.toString()
    traitDisplays["name"] = evolvingNFTRef.name
    traitDisplays["description"] = evolvingNFTRef.description
    traitDisplays["birthBlock"] = evolvingNFTRef.birthBlock.toString()
    
    return traitDisplays
} 