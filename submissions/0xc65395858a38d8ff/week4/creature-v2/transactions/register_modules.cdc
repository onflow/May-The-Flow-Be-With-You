// Register Trait Modules Transaction
import "EvolvingCreatureNFT"

transaction() {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Register modules directly using contract function
        // Get our contract address for modules
        let contractAddress = acct.address
        
        // Register Visual Traits Module
        EvolvingCreatureNFT.registerModule(moduleType: "visual", contractAddress: contractAddress, contractName: "VisualTraitsModule")
        log("Visual traits module registered")
        
        // Register Combat Stats Module  
        EvolvingCreatureNFT.registerModule(moduleType: "combat", contractAddress: contractAddress, contractName: "CombatStatsModule")
        log("Combat stats module registered")
        
        // Register Evolution Potential Module
        EvolvingCreatureNFT.registerModule(moduleType: "evolution", contractAddress: contractAddress, contractName: "EvolutionPotentialModule")
        log("Evolution potential module registered")
        
        // Register Metabolism Module
        EvolvingCreatureNFT.registerModule(moduleType: "metabolism", contractAddress: contractAddress, contractName: "MetabolismModule")
        log("Metabolism module registered")
        
        // Register Reproduction Module
        EvolvingCreatureNFT.registerModule(moduleType: "reproduction", contractAddress: contractAddress, contractName: "ReproductionModuleV2")
        log("Reproduction module registered")
        
        // Register Advanced Visual Traits Module
        EvolvingCreatureNFT.registerModule(moduleType: "advanced_visual", contractAddress: contractAddress, contractName: "AdvancedVisualTraitsModule")
        log("Advanced visual traits module registered")
        
        // Register Personality Module V2
        EvolvingCreatureNFT.registerModule(moduleType: "personality", contractAddress: contractAddress, contractName: "PersonalityModuleV2")
        log("Personality module V2 registered")
        
        log("All modules registered successfully!")
    }
} 