// register_modules.cdc
// Transaction to register trait modules with the core contract

import "EvolvingNFT"

transaction(deployerAddress: Address) {
    
    prepare(signer: &Account) {
        // Register the ColorModule
        EvolvingNFT.registerModule(
            moduleType: "color",
            contractAddress: deployerAddress,
            contractName: "ColorModule"
        )
        
        // Register the SizeModule
        EvolvingNFT.registerModule(
            moduleType: "size", 
            contractAddress: deployerAddress,
            contractName: "SizeModule"
        )
        
        // Register the PersonalityModule
        EvolvingNFT.registerModule(
            moduleType: "personality",
            contractAddress: deployerAddress,
            contractName: "PersonalityModule"
        )
        
        // Register the NEW COMPLEX StatsModule 🧠💪⚡❤️
        EvolvingNFT.registerModule(
            moduleType: "stats",
            contractAddress: deployerAddress,
            contractName: "StatsModule"
        )
        
        log("All modules registered successfully!")
    }
    
    execute {
        // Verify modules were registered
        let registeredModules = EvolvingNFT.getRegisteredModules()
        log("Registered modules count: ".concat(registeredModules.length.toString()))
        for moduleType in registeredModules {
            log("- ".concat(moduleType))
        }
    }
} 