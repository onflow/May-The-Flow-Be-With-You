// Register Trait Modules Transaction
import "EvolvingCreatureNFT"
import "VisualTraitsModule"
import "CombatStatsModule"
import "EvolutionPotentialModule"
import "MetabolismModule"

transaction() {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Get minter capability
        let minterCap = acct.capabilities.get<&EvolvingCreatureNFT.NFTMinter>(EvolvingCreatureNFT.MinterPublicPath)
        
        if minterCap.check() {
            let minter = minterCap.borrow()!
            
            // Register Visual Traits Module
            minter.registerModule("visual", VisualTraitsModule.createDefaultTrait)
            log("Visual traits module registered")
            
            // Register Combat Stats Module  
            minter.registerModule("combat", CombatStatsModule.createDefaultTrait)
            log("Combat stats module registered")
            
            // Register Evolution Potential Module
            minter.registerModule("evolution", EvolutionPotentialModule.createDefaultTrait)
            log("Evolution potential module registered")
            
            // Register Metabolism Module
            minter.registerModule("metabolism", MetabolismModule.createDefaultTrait)
            log("Metabolism module registered")
            
            log("All modules registered successfully!")
        } else {
            panic("No minter capability found")
        }
    }
} 