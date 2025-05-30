// test_complete_functionality.cdc
// Comprehensive test of the complete modular creature system

import "EvolvingCreatureNFT"
import "VisualTraitsModule"
import "CombatStatsModule"
import "EvolutionPotentialModule"
import "MetabolismModule"

access(all) fun main(): {String: AnyStruct} {
    let testResults: {String: AnyStruct} = {}
    
    // === TEST 1: MODULE REGISTRY ===
    let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
    testResults["registered_modules"] = registeredModules
    testResults["modules_count"] = registeredModules.length
    
    // === TEST 2: MODULE FACTORIES ===
    var moduleFactories: {String: Bool} = {}
    for moduleType in registeredModules {
        if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
            moduleFactories[moduleType] = true
        } else {
            moduleFactories[moduleType] = false
        }
    }
    testResults["module_factories"] = moduleFactories
    
    // === TEST 3: CHECK IF MODULES CAN CREATE TRAITS ===
    var traitCreationTest: {String: Bool} = {}
    
    // Test visual module
    if let visualFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "visual") {
        let defaultTrait <- visualFactory.createDefaultTrait()
        traitCreationTest["visual_creation"] = true
        destroy defaultTrait
    } else {
        traitCreationTest["visual_creation"] = false
    }
    
    // Test combat module
    if let combatFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "combat") {
        let defaultTrait <- combatFactory.createDefaultTrait()
        traitCreationTest["combat_creation"] = true
        destroy defaultTrait
    } else {
        traitCreationTest["combat_creation"] = false
    }
    
    testResults["trait_creation_tests"] = traitCreationTest
    
    // === TEST 4: CONTRACT CONSTANTS ===
    testResults["evolution_constants"] = {
        "TASA_APRENDIZAJE_HOMEOSTASIS_BASE": EvolvingCreatureNFT.TASA_APRENDIZAJE_HOMEOSTASIS_BASE,
        "TASA_EVOLUCION_PASIVA_GEN_BASE": EvolvingCreatureNFT.TASA_EVOLUCION_PASIVA_GEN_BASE,
        "FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE": EvolvingCreatureNFT.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE,
        "MAX_ACTIVE_CREATURES": EvolvingCreatureNFT.MAX_ACTIVE_CREATURES
    }
    
    // === TEST 5: TOTAL SUPPLY ===
    testResults["total_supply"] = EvolvingCreatureNFT.totalSupply
    
    // === TEST 6: MODULE INFO ===
    var moduleInfo: {String: {String: String}} = {}
    
    if let visualFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "visual") {
        moduleInfo["visual"] = {
            "type": visualFactory.getModuleType(),
            "version": visualFactory.getVersion()
        }
    }
    
    if let combatFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "combat") {
        moduleInfo["combat"] = {
            "type": combatFactory.getModuleType(),
            "version": combatFactory.getVersion()
        }
    }
    
    if let evolutionFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "evolution") {
        moduleInfo["evolution"] = {
            "type": evolutionFactory.getModuleType(),
            "version": evolutionFactory.getVersion()
        }
    }
    
    if let metabolismFactory = EvolvingCreatureNFT.getModuleFactory(moduleType: "metabolism") {
        moduleInfo["metabolism"] = {
            "type": metabolismFactory.getModuleType(),
            "version": metabolismFactory.getVersion()
        }
    }
    
    testResults["module_info"] = moduleInfo
    
    return testResults
} 