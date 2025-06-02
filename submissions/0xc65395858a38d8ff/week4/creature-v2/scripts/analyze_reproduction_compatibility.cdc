// Analyze Reproduction Compatibility Script
import "EvolvingCreatureNFT"

access(all) fun main(owner: Address, creature1ID: UInt64, creature2ID: UInt64): {String: AnyStruct} {
    // Get account and collection
    let account = getAccount(owner)
    let collectionCap = account.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
    
    if !collectionCap.check() {
        return {"error": "Collection not found"}
    }
    
    let collection = collectionCap.borrow()!
    
    // Get both creatures
    let nft1 = collection.borrowEvolvingCreatureNFT(id: creature1ID)
    let nft2 = collection.borrowEvolvingCreatureNFT(id: creature2ID)
    
    if nft1 == nil {
        return {"error": "Creature 1 not found"}
    }
    if nft2 == nil {
        return {"error": "Creature 2 not found"}
    }
    
    let creature1 = nft1!
    let creature2 = nft2!
    
    // Get reproduction trait values (trigger lazy init if needed)
    let repro1Value = creature1.getTraitValue(traitType: "reproduction")
    let repro2Value = creature2.getTraitValue(traitType: "reproduction")
    
    let repro1Display = creature1.getTraitDisplay(traitType: "reproduction")
    let repro2Display = creature2.getTraitDisplay(traitType: "reproduction")
    
    // Basic reproduction requirements
    let creature1Alive = creature1.estaViva
    let creature2Alive = creature2.estaViva
    
    // Parse maturity from reproduction values (simplified parsing)
    let creature1Mature = repro1Value != nil && repro1Value!.contains("MAT:") // Would need proper parsing
    let creature2Mature = repro2Value != nil && repro2Value!.contains("MAT:") // Would need proper parsing
    
    // Calculate basic compatibility requirements
    let bothAlive = creature1Alive && creature2Alive
    let bothHaveReproduction = repro1Value != nil && repro2Value != nil
    
    // For detailed compatibility, we'd need to parse the genetic markers
    // For now, show basic status
    
    let result: {String: AnyStruct} = {
        "creature1": {
            "id": creature1ID,
            "name": creature1.name,
            "alive": creature1Alive,
            "age": creature1.edadDiasCompletos,
            "reproductionValue": repro1Value,
            "reproductionDisplay": repro1Display,
            "hasReproduction": repro1Value != nil
        },
        "creature2": {
            "id": creature2ID,
            "name": creature2.name,
            "alive": creature2Alive,
            "age": creature2.edadDiasCompletos,
            "reproductionValue": repro2Value,
            "reproductionDisplay": repro2Display,
            "hasReproduction": repro2Value != nil
        },
        "compatibility": {
            "bothAlive": bothAlive,
            "bothHaveReproduction": bothHaveReproduction,
            "basicRequirementsMet": bothAlive && bothHaveReproduction,
            "note": "For detailed genetic compatibility, both creatures need reproductive maturity >= 0.7"
        }
    }
    
    return result
} 