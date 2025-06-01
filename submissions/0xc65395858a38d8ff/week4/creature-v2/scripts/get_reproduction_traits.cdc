// Get Reproduction Traits Script
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
    
    // Check if reproduction module is registered
    let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
    var reproductionRegistered = false
    for moduleType in registeredModules {
        if moduleType == "reproduction" {
            reproductionRegistered = true
            break
        }
    }
    
    if !reproductionRegistered {
        return {"error": "Reproduction module not registered"}
    }
    
    // Get reproduction trait value (will trigger lazy initialization if needed)
    let reproductionValue = nftRef.getTraitValue(traitType: "reproduction")
    let reproductionDisplay = nftRef.getTraitDisplay(traitType: "reproduction")
    
    // Also get basic creature info for context
    let result: {String: AnyStruct} = {
        "creatureID": nftRef.id,
        "creatureName": nftRef.name,
        "isAlive": nftRef.estaViva,
        "age": nftRef.edadDiasCompletos,
        "evolutionPoints": nftRef.puntosEvolucion,
        "reproductionModuleRegistered": reproductionRegistered,
        "reproductionValue": reproductionValue,
        "reproductionDisplay": reproductionDisplay,
        "reproductionExists": reproductionValue != nil
    }
    
    return result
} 