// Register Trait Modules Transaction
import "EvolvingCreatureNFT"

transaction() {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Register modules directly using contract function
        // Get our contract address for modules
        let contractAddress = acct.address
        
        // Register Visual Traits Module
        EvolvingCreatureNFT.registerModule("visual", contractAddress, "VisualTraitsModule")
        log("Visual traits module registered")
        
        // Register Combat Stats Module  
        EvolvingCreatureNFT.registerModule("combat", contractAddress, "CombatStatsModule")
        log("Combat stats module registered")
        
        // Register Evolution Potential Module
        EvolvingCreatureNFT.registerModule("evolution", contractAddress, "EvolutionPotentialModule")
        log("Evolution potential module registered")
        
        // Register Metabolism Module
        EvolvingCreatureNFT.registerModule("metabolism", contractAddress, "MetabolismModule")
        log("Metabolism module registered")
        
        log("All modules registered successfully!")
    }
} 