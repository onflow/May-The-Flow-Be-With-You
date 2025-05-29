// get_nft_traits.cdc
// Script to read NFT traits and display them

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
    
    // Get color trait if it exists
    if let colorValue = evolvingNFTRef.getTraitValue(traitType: "color") {
        if let colorDisplay = evolvingNFTRef.getTraitDisplay(traitType: "color") {
            traitDisplays["color"] = colorDisplay
        }
    }
    
    // Get size trait if it exists
    if let sizeValue = evolvingNFTRef.getTraitValue(traitType: "size") {
        if let sizeDisplay = evolvingNFTRef.getTraitDisplay(traitType: "size") {
            traitDisplays["size"] = sizeDisplay
        }
    }
    
    // Add basic NFT info
    traitDisplays["id"] = nftID.toString()
    traitDisplays["name"] = evolvingNFTRef.name
    traitDisplays["description"] = evolvingNFTRef.description
    traitDisplays["birthBlock"] = evolvingNFTRef.birthBlock.toString()
    
    return traitDisplays
} 