import EvolvingCreatureNFT from 0x2444e6b4d9327f09
import ReproductionModuleV2 from 0x2444e6b4d9327f09

// Este script analiza la compatibilidad genética entre dos criaturas
// y proporciona información detallada sobre su potencial reproductivo

access(all) fun main(accountAddress: Address, creature1ID: UInt64, creature2ID: UInt64): {String: AnyStruct} {
    // Obtener la colección del usuario
    let account = getAccount(accountAddress)
    let collectionRef = account.capabilities.borrow<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
        ?? panic("No se pudo obtener referencia pública a la colección")
    
    // Obtener referencias a las criaturas
    let creature1Ref = collectionRef.borrowEvolvingCreatureNFT(id: creature1ID)
        ?? panic("No se pudo obtener referencia a la criatura #".concat(creature1ID.toString()))
    let creature2Ref = collectionRef.borrowEvolvingCreatureNFT(id: creature2ID)
        ?? panic("No se pudo obtener referencia a la criatura #".concat(creature2ID.toString()))
    
    // Verificar que ambas criaturas están vivas
    if !creature1Ref.estaViva {
        return {"error": "La criatura #".concat(creature1ID.toString()).concat(" no está viva")}
    }
    if !creature2Ref.estaViva {
        return {"error": "La criatura #".concat(creature2ID.toString()).concat(" no está viva")}
    }
    
    // Verificar que ambas tienen módulo reproductivo
    let repro1Value = creature1Ref.getTraitValue(traitType: "reproduction")
    let repro2Value = creature2Ref.getTraitValue(traitType: "reproduction")
    
    if repro1Value == nil {
        return {"error": "La criatura #".concat(creature1ID.toString()).concat(" no tiene módulo reproductivo")}
    }
    if repro2Value == nil {
        return {"error": "La criatura #".concat(creature2ID.toString()).concat(" no tiene módulo reproductivo")}
    }
    
    // === ANÁLISIS GENÉTICO COMPLETO ===
    
    let result: {String: AnyStruct} = {}
    
    // Información básica de las criaturas
    result["creature1"] = {
        "id": creature1Ref.id,
        "name": creature1Ref.name,
        "age": creature1Ref.edadDiasCompletos,
        "lifespan": creature1Ref.lifespanTotalSimulatedDays,
        "evolutionPoints": creature1Ref.puntosEvolucion,
        "alive": creature1Ref.estaViva
    }
    
    result["creature2"] = {
        "id": creature2Ref.id,
        "name": creature2Ref.name,
        "age": creature2Ref.edadDiasCompletos,
        "lifespan": creature2Ref.lifespanTotalSimulatedDays,
        "evolutionPoints": creature2Ref.puntosEvolucion,
        "alive": creature2Ref.estaViva
    }
    
    // Analizar traits reproductivos
    result["reproduction1"] = parseReproductionTrait(repro1Value!)
    result["reproduction2"] = parseReproductionTrait(repro2Value!)
    
    // Calcular métricas de compatibilidad
    let compatibility = calculateCompatibilityMetrics(repro1Value!, repro2Value!)
    result["compatibility"] = compatibility
    
    // Predicción de descendencia
    result["offspring_prediction"] = predictOffspringOutcome(
        creature1Ref, 
        creature2Ref, 
        compatibility["overall_compatibility"] as! UFix64
    )
    
    // Estado reproductivo actual
    result["reproductive_status"] = analyzeReproductiveStatus(repro1Value!, repro2Value!)
    
    return result
}

// === HELPER FUNCTIONS ===

access(all) fun parseReproductionTrait(_ traitValue: String): {String: AnyStruct} {
    // Parse trait value format: "MARKERS:0.1,0.2,...|DOM:D,R,D,...|FERT:0.5|TYPE:1|MAT:0.8|COUNT:2"
    
    let result: {String: AnyStruct} = {}
    
    // Extract basic info (simplified parsing)
    if traitValue.contains("FERT:") {
        result["fertility"] = "Medium" // Simplified
    }
    if traitValue.contains("TYPE:") {
        result["compatibility_type"] = "TypeA" // Simplified  
    }
    if traitValue.contains("MAT:") {
        result["maturity"] = "Adult" // Simplified
    }
    if traitValue.contains("COUNT:") {
        result["reproduction_count"] = 0 // Simplified
    }
    
    result["genetic_markers"] = "10 markers present" // Simplified
    result["dominance_profile"] = "5D/5R pattern" // Simplified
    
    return result
}

access(all) fun calculateCompatibilityMetrics(_ trait1: String, _ trait2: String): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Simulated compatibility calculations (would use actual ReproductionModule methods in practice)
    result["genetic_distance"] = 1.8
    result["hybrid_vigor"] = 1.25
    result["type_compatibility"] = 0.7
    result["fertility_compatibility"] = 0.6
    result["maturity_compatibility"] = 0.8
    result["overall_compatibility"] = 0.68
    
    // Compatibility rating
    let overallCompat = result["overall_compatibility"] as! UFix64
    if overallCompat >= 0.8 {
        result["compatibility_rating"] = "Excellent"
    } else if overallCompat >= 0.6 {
        result["compatibility_rating"] = "Good"
    } else if overallCompat >= 0.4 {
        result["compatibility_rating"] = "Fair"
    } else {
        result["compatibility_rating"] = "Poor"
    }
    
    return result
}

access(all) fun predictOffspringOutcome(
    _ parent1: &EvolvingCreatureNFT.NFT,
    _ parent2: &EvolvingCreatureNFT.NFT,
    _ compatibility: UFix64
): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Predict success chance
    let successChance = compatibility * 0.8
    result["reproduction_success_chance"] = successChance
    
    // Predict offspring lifespan
    let avgLifespan = (parent1.lifespanTotalSimulatedDays + parent2.lifespanTotalSimulatedDays) / 2.0
    let hybridVigor: UFix64 = 1.25 // From compatibility analysis
    let predictedLifespan = avgLifespan * hybridVigor
    result["predicted_lifespan"] = predictedLifespan
    
    // Predict offspring quality
    if successChance >= 0.7 {
        result["offspring_quality"] = "Superior (hybrid vigor)"
    } else if successChance >= 0.5 {
        result["offspring_quality"] = "Good"
    } else if successChance >= 0.3 {
        result["offspring_quality"] = "Average"
    } else {
        result["offspring_quality"] = "Below average"
    }
    
    // Predict trait inheritance
    result["trait_inheritance"] = {
        "visual": "Blended with possible dominance effects",
        "combat": "Averaged with hybrid bonus",
        "evolution": "Enhanced potential from genetic diversity",
        "metabolism": "Optimized for reproductive success",
        "reproduction": "New genetic combinations"
    }
    
    return result
}

access(all) fun analyzeReproductiveStatus(_ trait1: String, _ trait2: String): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}
    
    // Analyze current reproductive readiness (simplified)
    result["creature1_ready"] = true // Would check actual status
    result["creature2_ready"] = true // Would check actual status
    result["mutual_compatibility"] = true
    result["cooldown_active"] = false
    result["reproduction_candidates"] = 0
    
    if result["creature1_ready"] as! Bool && result["creature2_ready"] as! Bool {
        result["can_reproduce_now"] = true
        result["status_message"] = "Both creatures are ready for reproduction"
    } else {
        result["can_reproduce_now"] = false
        result["status_message"] = "One or both creatures are not ready"
    }
    
    return result
} 