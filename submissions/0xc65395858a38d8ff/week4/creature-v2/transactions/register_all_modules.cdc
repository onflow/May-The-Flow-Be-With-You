// register_all_modules.cdc
// Register all trait modules with the core EvolvingCreatureNFT contract

import "EvolvingCreatureNFT"

transaction(contractAddress: Address) {
    prepare(signer: AuthAccount) {
        // Register all modules with the core contract
        
        // 1. Visual Traits Module
        EvolvingCreatureNFT.registerModule(
            moduleType: "visual",
            contractAddress: contractAddress,
            contractName: "VisualTraitsModule"
        )
        
        // 2. Combat Stats Module
        EvolvingCreatureNFT.registerModule(
            moduleType: "combat", 
            contractAddress: contractAddress,
            contractName: "CombatStatsModule"
        )
        
        // 3. Evolution Potential Module
        EvolvingCreatureNFT.registerModule(
            moduleType: "evolution",
            contractAddress: contractAddress, 
            contractName: "EvolutionPotentialModule"
        )
        
        // 4. Metabolism Module
        EvolvingCreatureNFT.registerModule(
            moduleType: "metabolism",
            contractAddress: contractAddress,
            contractName: "MetabolismModule"
        )
        
        log("All modules registered successfully!")
    }
} 