// TraitModule.cdc
// Base interface for modular trait system - CREATURE EVOLUTION ARCHITECTURE

access(all) contract interface TraitModule {
    
    // === CORE TRAIT INTERFACE ===
    access(all) resource interface Trait {
        access(all) view fun getValue(): String
        access(all) fun setValue(newValue: String)
        access(all) view fun getDisplayName(): String
        access(all) fun evolve(seeds: [UInt64]): String
    }
    
    // === FACTORY INTERFACE ===
    access(all) fun createDefaultTrait(): @{Trait}
    access(all) fun createTraitWithValue(value: String): @{Trait}
    access(all) fun createChildTrait(parent1: &{Trait}, parent2: &{Trait}, seed: UInt64): @{Trait}
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String
    access(all) view fun getVersion(): String
} 