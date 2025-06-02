// get_registered_modules.cdc
// Script to check registered modules in the system

import "EvolvingNFT"

access(all) fun main(): [String] {
    // Get all registered modules
    let registeredModules = EvolvingNFT.getRegisteredModules()
    
    log("Registered modules:")
    for moduleType in registeredModules {
        log("- ".concat(moduleType))
    }
    
    return registeredModules
} 