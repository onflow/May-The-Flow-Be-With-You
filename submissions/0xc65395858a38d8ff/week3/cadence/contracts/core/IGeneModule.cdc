// IGeneModule.cdc
// Interfaz común para todos los módulos de genes

access(all) resource interface IGeneModule {
    
    // === IDENTIFICACIÓN DEL MÓDULO ===
    access(all) fun getModuleType(): String
    access(all) fun getModuleVersion(): String
    
    // === GESTIÓN DE GENES ===
    access(all) fun getGenes(): {String: UFix64}
    access(all) fun setGene(name: String, value: UFix64)
    access(all) fun getGene(name: String): UFix64?
    access(all) fun getGeneRanges(): {String: {String: UFix64}}
    access(all) fun getAllGeneNames(): [String]
    
    // === EVOLUCIÓN ===
    access(all) fun evolveStep(
        seeds: [UInt64], 
        stepsPerDay: UInt64, 
        potencialEvolutivo: UFix64,
        homeostasisTargets: {String: UFix64}
    ): {String: UFix64} // Retorna genes modificados
    
    // === REPRODUCCIÓN ===
    // Función que define cómo este módulo combina genes en reproducción sexual
    access(all) fun combineGenesForSexualReproduction(
        otherParentModule: &{IGeneModule},
        childSeed: UInt64,
        reproductionContext: {String: AnyStruct}
    ): {String: UFix64} // Retorna genes del hijo
    
    // Función que define cómo este módulo muta genes en mitosis
    access(all) fun mutateGenesForMitosis(
        childSeed: UInt64,
        epCost: UFix64,
        mitosisContext: {String: AnyStruct}
    ): {String: UFix64} // Retorna genes del hijo
    
    // === VALIDACIÓN ===
    access(all) fun validateGeneValue(geneName: String, value: UFix64): Bool
    access(all) fun clampGeneValue(geneName: String, value: UFix64): UFix64
    
    // === SERIALIZACIÓN ===
    access(all) fun serialize(): {String: AnyStruct}
    access(all) fun deserialize(data: {String: AnyStruct})
    
    // === COMPATIBILIDAD ===
    access(all) fun isCompatibleWith(otherModule: &{IGeneModule}): Bool
}

// === INTERFAZ PARA FACTORIES DE MÓDULOS ===
access(all) contract interface IModuleFactory {
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultModule(): @{IGeneModule}
    access(all) fun createModuleWithGenes(initialGenes: {String: UFix64}): @{IGeneModule}
    
    access(all) fun createModuleFromSexualReproduction(
        parent1Module: &{IGeneModule},
        parent2Module: &{IGeneModule}, 
        childSeed: UInt64,
        reproductionContext: {String: AnyStruct}
    ): @{IGeneModule}
    
    access(all) fun createModuleFromMitosis(
        parentModule: &{IGeneModule},
        childSeed: UInt64,
        epCost: UFix64,
        mitosisContext: {String: AnyStruct}
    ): @{IGeneModule}
    
    // === IDENTIFICACIÓN ===
    access(all) view fun getModuleType(): String
    access(all) view fun getModuleVersion(): String
} 