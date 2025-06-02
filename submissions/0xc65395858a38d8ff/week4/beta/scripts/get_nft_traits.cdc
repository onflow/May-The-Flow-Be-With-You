// get_nft_traits.cdc
// Script to read NFT traits with LAZY INITIALIZATION 🚀

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
    
    // 🚀 DYNAMIC: Get ALL registered modules (not just hardcoded ones)
    let registeredModules = EvolvingNFT.getRegisteredModules()
    
    for moduleType in registeredModules {
        // 🚀 LAZY INIT: Use getTraitValueWithInit which auto-creates missing traits
        if let traitValue = evolvingNFTRef.getTraitValueWithInit(traitType: moduleType) {
            if let traitDisplay = evolvingNFTRef.getTraitDisplay(traitType: moduleType) {
                traitDisplays[moduleType] = traitDisplay
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