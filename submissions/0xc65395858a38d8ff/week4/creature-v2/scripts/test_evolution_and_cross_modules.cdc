// test_evolution_and_cross_modules.cdc
// Test evolution and cross-module influences

import "EvolvingCreatureNFT"
import "NonFungibleToken"

access(all) fun main(ownerAddress: Address, nftID: UInt64): {String: AnyStruct} {
    let testResults: {String: AnyStruct} = {}
    
    // Get collection reference
    let collectionRef = getAccount(ownerAddress)
        .getCapability(EvolvingCreatureNFT.CollectionPublicPath)
        .borrow<&EvolvingCreatureNFT.Collection{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow collection reference")
    
    // Get NFT reference
    let nftRef = collectionRef.borrowNFT(id: nftID) as! &EvolvingCreatureNFT.NFT
    
    // === BEFORE EVOLUTION ===
    testResults["before_evolution"] = {
        "age_days": nftRef.edadDiasCompletos,
        "evolution_points": nftRef.puntosEvolucion,
        "is_alive": nftRef.estaViva,
        "initial_seed": nftRef.initialSeed,
        "visual_traits": nftRef.getTraitValue("visual") ?? "Not initialized",
        "combat_stats": nftRef.getTraitValue("combat") ?? "Not initialized",
        "evolution_potential": nftRef.getTraitValue("evolution") ?? "Not initialized",
        "metabolism": nftRef.getTraitValue("metabolism") ?? "Not initialized"
    }
    
    // === GENERATE DESTINY SEEDS ===
    let currentSeeds = nftRef.generateDailySeeds(UInt64(nftRef.edadDiasCompletos))
    testResults["destiny_seeds"] = currentSeeds
    
    // === EVOLUTION TEST ===
    // Note: This would require auth capability to actually call evolve()
    // For testing, we can only read the current state and verify that
    // evolution mechanics are properly set up
    
    testResults["evolution_setup"] = {
        "can_evolve": nftRef.estaViva,
        "has_visual_traits": nftRef.getTraitValue("visual") != nil,
        "has_combat_stats": nftRef.getTraitValue("combat") != nil,
        "has_evolution_potential": nftRef.getTraitValue("evolution") != nil,
        "has_metabolism": nftRef.getTraitValue("metabolism") != nil
    }
    
    // === HOMEOSTASIS TEST ===
    let homeostasisTargets = nftRef.homeostasisTargets
    testResults["homeostasis"] = {
        "targets_count": homeostasisTargets.length,
        "targets": homeostasisTargets
    }
    
    // === CROSS-MODULE ANALYSIS ===
    // Analyze how traits should influence each other
    if let visualValue = nftRef.getTraitValue("visual") {
        if let combatValue = nftRef.getTraitValue("combat") {
            testResults["cross_module_analysis"] = {
                "visual_data": visualValue,
                "combat_data": combatValue,
                "cross_influences_active": true
            }
        }
    }
    
    // === MODULE REGISTRY CHECK ===
    let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
    testResults["registered_modules"] = registeredModules
    
    // === EP CALCULATION CONSTANTS ===
    testResults["constants"] = {
        "PYTHON_MULTIPLIER": EvolvingCreatureNFT.PYTHON_MULTIPLIER,
        "TASA_EVOLUCION_PASIVA_GEN_BASE": EvolvingCreatureNFT.TASA_EVOLUCION_PASIVA_GEN_BASE,
        "TASA_APRENDIZAJE_HOMEOSTASIS_BASE": EvolvingCreatureNFT.TASA_APRENDIZAJE_HOMEOSTASIS_BASE,
        "FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE": EvolvingCreatureNFT.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE
    }
    
    // === TRAIT DISPLAY NAMES ===
    var traitDisplays: {String: String} = {}
    for moduleType in registeredModules {
        if let traitValue = nftRef.getTraitValue(moduleType) {
            // We can't call getDisplayName() from a script without auth
            // But we can verify the trait values exist
            traitDisplays[moduleType] = "Value: ".concat(traitValue)
        }
    }
    testResults["trait_displays"] = traitDisplays
    
    return testResults
} 