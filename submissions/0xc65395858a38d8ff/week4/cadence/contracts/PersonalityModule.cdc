// PersonalityModule.cdc
// New module to test backward compatibility

import "TraitModule"

access(all) contract PersonalityModule: TraitModule {
    
    // === CONSTANTS ===
    access(all) let MOODS: [String]
    access(all) let ENERGY_MIN: UInt8
    access(all) let ENERGY_MAX: UInt8
    
    // === EVENTS ===
    access(all) event PersonalityChanged(oldMood: String, newMood: String, oldEnergy: UInt8, newEnergy: UInt8)
    access(all) event PersonalityEvolved(oldMood: String, newMood: String, seed: UInt64)
    
    // === PERSONALITY TRAIT RESOURCE ===
    access(all) resource PersonalityTrait: TraitModule.Trait {
        access(self) var mood: String
        access(self) var energy: UInt8
        
        init(initialMood: String, initialEnergy: UInt8) {
            self.mood = self.validateMood(initialMood) ? initialMood : "Happy"
            self.energy = self.clampEnergy(initialEnergy)
        }
        
        access(all) view fun getValue(): String {
            return self.mood.concat("|").concat(self.energy.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Parse mood|energy format
            let parts = newValue.split(separator: "|")
            if parts.length == 2 {
                let newMood = parts[0]
                if let newEnergy = UInt8.fromString(parts[1]) {
                    let oldMood = self.mood
                    let oldEnergy = self.energy
                    
                    if self.validateMood(newMood) {
                        self.mood = newMood
                        self.energy = self.clampEnergy(newEnergy)
                        emit PersonalityChanged(oldMood: oldMood, newMood: newMood, oldEnergy: oldEnergy, newEnergy: self.energy)
                    }
                }
            }
        }
        
        access(all) view fun getDisplayName(): String {
            return "Personality: ".concat(self.mood).concat(" (Energy: ").concat(self.energy.toString()).concat("/10)")
        }
        
        access(all) fun evolve(seed: UInt64): String {
            let oldMood = self.mood
            
            // 30% chance to change mood, always change energy slightly
            if seed % 100 < 30 {
                let moodIndex = Int(seed % UInt64(PersonalityModule.MOODS.length))
                self.mood = PersonalityModule.MOODS[moodIndex]
            }
            
            // Energy fluctuation ±2
            let energyChange = Int((seed / 100) % 5) - 2 // -2 to +2
            let newEnergy = Int(self.energy) + energyChange
            self.energy = self.clampEnergy(UInt8(newEnergy))
            
            emit PersonalityEvolved(oldMood: oldMood, newMood: self.mood, seed: seed)
            return self.getValue()
        }
        
        access(self) fun validateMood(_ mood: String): Bool {
            for validMood in PersonalityModule.MOODS {
                if validMood == mood {
                    return true
                }
            }
            return false
        }
        
        access(self) fun clampEnergy(_ energy: UInt8): UInt8 {
            if energy < PersonalityModule.ENERGY_MIN { return PersonalityModule.ENERGY_MIN }
            if energy > PersonalityModule.ENERGY_MAX { return PersonalityModule.ENERGY_MAX }
            return energy
        }
    }
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create PersonalityTrait(initialMood: "Happy", initialEnergy: 5)
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let parts = value.split(separator: "|")
        if parts.length == 2 {
            let mood = parts[0]
            if let energy = UInt8.fromString(parts[1]) {
                return <- create PersonalityTrait(initialMood: mood, initialEnergy: energy)
            }
        }
        return <- create PersonalityTrait(initialMood: "Happy", initialEnergy: 5)
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Parse parent values
        let parent1Parts = parent1.getValue().split(separator: "|")
        let parent2Parts = parent2.getValue().split(separator: "|")
        
        // Inherit mood from random parent
        let parentChoice = seed % 2
        let inheritedMood = parentChoice == 0 ? parent1Parts[0] : parent2Parts[0]
        
        // Average energy with some variance
        let parent1Energy = UInt8.fromString(parent1Parts[1]) ?? 5
        let parent2Energy = UInt8.fromString(parent2Parts[1]) ?? 5
        let avgEnergy = (UInt16(parent1Energy) + UInt16(parent2Energy)) / 2
        let variance = Int((seed / 10) % 3) - 1 // -1, 0, or 1
        let childEnergy = UInt8(Int(avgEnergy) + variance)
        
        return <- create PersonalityTrait(initialMood: inheritedMood, initialEnergy: childEnergy)
    }
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String {
        return "personality"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        self.MOODS = ["Happy", "Grumpy", "Curious", "Sleepy", "Excited", "Calm", "Playful", "Serious"]
        self.ENERGY_MIN = 1
        self.ENERGY_MAX = 10
    }
} 