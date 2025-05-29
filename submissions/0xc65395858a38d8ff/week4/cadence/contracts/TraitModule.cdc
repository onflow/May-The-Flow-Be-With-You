// TraitModule.cdc
// Simple interface for modular traits

access(all) contract interface TraitModule {
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String
    access(all) view fun getVersion(): String
    
    // === TRAIT MANAGEMENT ===
    access(all) resource interface Trait {
        access(all) view fun getValue(): String
        access(all) fun setValue(newValue: String)
        access(all) view fun getDisplayName(): String
        access(all) fun evolve(seed: UInt64): String
    }
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultTrait(): @{Trait}
    access(all) fun createTraitWithValue(value: String): @{Trait}
    access(all) fun createChildTrait(parent1: &{Trait}, parent2: &{Trait}, seed: UInt64): @{Trait}
} 