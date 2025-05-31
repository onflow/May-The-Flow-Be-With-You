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
    
    // Get individual trait values first
    let traitValues: {String: String?} = {}
    let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
    
    for moduleType in registeredModules {
        traitValues[moduleType] = nftRef.getTraitValue(traitType: moduleType)
    }
    
    // Get basic NFT info using correct property names
    let result: {String: AnyStruct} = {
        "id": nftRef.id,
        "name": nftRef.name,
        "description": nftRef.description,
        "thumbnail": nftRef.thumbnail,
        "estaViva": nftRef.estaViva,
        "edadDiasCompletos": nftRef.edadDiasCompletos,
        "puntosEvolucion": nftRef.puntosEvolucion,
        "lifespanTotalSimulatedDays": nftRef.lifespanTotalSimulatedDays,
        "initialSeed": nftRef.initialSeed,
        "traitValues": traitValues,
        "registeredModules": registeredModules
    }
    
    return result
} 