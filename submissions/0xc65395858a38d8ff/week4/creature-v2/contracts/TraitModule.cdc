// TraitModule.cdc
// Base interface for all trait modules in the modular creature system

access(all) contract interface TraitModule {
    
    // === TRAIT RESOURCE INTERFACE ===
    // All traits must implement this interface
    access(all) resource interface Trait {
        // Get the trait's current value as a string
        access(all) view fun getValue(): String
        
        // Set the trait's value from a string representation
        access(all) fun setValue(newValue: String)
        
        // Get a human-readable display name for the trait
        access(all) view fun getDisplayName(): String
        
        // Evolve the trait based on random seeds
        access(all) fun evolve(seeds: [UInt64]): String
    }
    
    // === FACTORY FUNCTIONS ===
    // All trait modules must provide these factory functions
    
    // Create a trait with default values
    access(all) fun createDefaultTrait(): @{Trait}
    
    // Create a trait with a specific value
    access(all) fun createTraitWithValue(value: String): @{Trait}
    
    // Create a child trait from two parents (for reproduction)
    access(all) fun createChildTrait(parent1: &{Trait}, parent2: &{Trait}, seed: UInt64): @{Trait}
    
    // NEW: Factory function for seed-based trait creation
    access(all) fun createTraitWithSeed(seed: UInt64): @{Trait}
    
    // === MODULE IDENTITY ===
    // Module identification functions
    
    // Get the type of this module (e.g., "visual", "combat", etc.)
    access(all) view fun getModuleType(): String
    
    // Get the version of this module
    access(all) view fun getVersion(): String
    
    // Metadata
    access(all) view fun getModuleName(): String
    access(all) view fun getModuleDescription(): String
} 