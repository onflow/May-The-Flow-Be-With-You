// List All Creatures and Their Reproductive Status
import "EvolvingCreatureNFT"

access(all) fun main(owner: Address): {String: AnyStruct} {
    // Get account and collection
    let account = getAccount(owner)
    let collectionCap = account.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
    
    if !collectionCap.check() {
        return {"error": "Collection not found"}
    }
    
    let collection = collectionCap.borrow()!
    let creatureIDs = collection.getIDs()
    
    let creatures: [{String: AnyStruct}] = []
    
    for creatureID in creatureIDs {
        if let creature = collection.borrowEvolvingCreatureNFT(id: creatureID) {
            // Get reproduction info (triggers lazy init)
            let reproValue = creature.getTraitValue(traitType: "reproduction")
            let reproDisplay = creature.getTraitDisplay(traitType: "reproduction")
            
            // Parse maturity value (simplified)
            var maturityLevel = "Unknown"
            var canReproduce = false
            
            if let reproString = reproValue {
                if reproString.contains("🐣Juvenile") {
                    maturityLevel = "Juvenile"
                    canReproduce = false
                } else if reproString.contains("🐥Adolescent") {
                    maturityLevel = "Adolescent" 
                    canReproduce = false
                } else if reproString.contains("🐓Adult") {
                    maturityLevel = "Adult"
                    canReproduce = true
                } else if reproString.contains("🦅Mature") {
                    maturityLevel = "Mature"
                    canReproduce = true
                }
            }
            
            let creatureInfo = {
                "id": creatureID,
                "name": creature.name,
                "alive": creature.estaViva,
                "age": creature.edadDiasCompletos,
                "evolutionPoints": creature.puntosEvolucion,
                "maturityLevel": maturityLevel,
                "canReproduce": canReproduce,
                "reproductionDisplay": reproDisplay,
                "hasReproductionTrait": reproValue != nil
            }
            
            creatures.append(creatureInfo)
        }
    }
    
    // Filter creatures that can potentially reproduce
    let reproductiveCandidates: [{String: AnyStruct}] = []
    for creature in creatures {
        if creature["canReproduce"] as! Bool && creature["alive"] as! Bool {
            reproductiveCandidates.append(creature)
        }
    }
    
    return {
        "totalCreatures": creatureIDs.length,
        "allCreatures": creatures,
        "reproductiveCandidates": reproductiveCandidates,
        "reproductiveCandidatesCount": reproductiveCandidates.length,
        "summary": "Creatures need maturity >= 0.7 (Adult/Mature) to reproduce"
    }
} 