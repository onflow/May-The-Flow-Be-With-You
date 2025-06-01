// Get All Active Creatures Script
import "EvolvingCreatureNFT"

access(all) fun main(owner: Address): {String: AnyStruct} {
    // Get account and collection
    let account = getAccount(owner)
    let collectionCap = account.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
    
    if !collectionCap.check() {
        return {"error": "Collection not found for address ".concat(owner.toString())}
    }
    
    let collection = collectionCap.borrow()!
    
    // Get active creatures count and IDs
    let activeCreatureIDs = collection.getActiveCreatureIDs()
    let totalCreatures = collection.getIDs()
    
    // Get detailed info for each active creature
    var activeCreatures: [{String: AnyStruct}] = []
    
    for creatureID in activeCreatureIDs {
        if let nft = collection.borrowEvolvingCreatureNFT(id: creatureID) {
                         // Get individual trait values
             let traitValues: {String: String?} = {}
             let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
             
             for moduleType in registeredModules {
                 traitValues[moduleType] = nft.getTraitValue(traitType: moduleType)
             }
            
            // Calculate remaining lifespan safely (avoid underflow)
            let remainingDays = nft.lifespanTotalSimulatedDays > nft.edadDiasCompletos ? 
                nft.lifespanTotalSimulatedDays - nft.edadDiasCompletos : 0.0
            
            // Create creature info object
            let creatureInfo: {String: AnyStruct} = {
                "id": nft.id,
                "name": nft.name,
                "description": nft.description,
                "thumbnail": nft.thumbnail,
                "estaViva": nft.estaViva,
                "edadDiasCompletos": nft.edadDiasCompletos,
                "puntosEvolucion": nft.puntosEvolucion,
                "lifespanTotalSimulatedDays": nft.lifespanTotalSimulatedDays,
                "lifespanRemainingDays": remainingDays,
                "initialSeed": nft.initialSeed,
                "traitValues": traitValues
            }
            
            activeCreatures.append(creatureInfo)
        }
    }
    
    // Summary information
    let result: {String: AnyStruct} = {
        "owner": owner.toString(),
        "totalCreatures": totalCreatures.length,
        "activeCreatures": activeCreatures.length,
        "maxActiveCreatures": 5, // From contract constant
        "slotsAvailable": 5 - activeCreatures.length,
        "allCreatureIDs": totalCreatures,
        "activeCreatureIDs": activeCreatureIDs,
        "creatures": activeCreatures,
        "registeredModules": EvolvingCreatureNFT.getRegisteredModules()
    }
    
    return result
} 