// Get NFT Traits Script
import "EvolvingCreatureNFT"

access(all) fun main(owner: Address, nftID: UInt64): {String: AnyStruct} {
    // Get account and collection
    let account = getAccount(owner)
    let collectionCap = account.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
    
    if !collectionCap.check() {
        return {"error": "Collection not found"}
    }
    
    let collection = collectionCap.borrow()!
    let nft = collection.borrowEvolvingCreatureNFT(id: nftID)
    
    if nft == nil {
        return {"error": "NFT not found"}
    }
    
    let nftRef = nft!
    
    // Get basic NFT info
    let result: {String: AnyStruct} = {
        "id": nftRef.id,
        "name": nftRef.name,
        "description": nftRef.description,
        "thumbnail": nftRef.thumbnail,
        "isAlive": nftRef.isAlive,
        "age": nftRef.age,
        "evolutionPoints": nftRef.evolutionPoints,
        "traits": nftRef.getTraitsDisplay(),
        "registeredModules": nftRef.getRegisteredModuleTypes()
    }
    
    return result
} 