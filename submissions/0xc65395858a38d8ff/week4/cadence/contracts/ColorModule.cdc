// ColorModule.cdc
// Example implementation of a color trait module

import "TraitModule"

access(all) contract ColorModule: TraitModule {
    
    // === CONSTANTS ===
    access(all) let COLORS: [String]
    
    // === EVENTS ===
    access(all) event ColorChanged(oldColor: String, newColor: String)
    access(all) event ColorEvolved(oldColor: String, newColor: String, seed: UInt64)
    
    // === COLOR TRAIT RESOURCE ===
    access(all) resource ColorTrait: TraitModule.Trait {
        access(self) var color: String
        
        init(initialColor: String) {
            self.color = self.validateColor(initialColor) ? initialColor : "Red"
        }
        
        access(all) view fun getValue(): String {
            return self.color
        }
        
        access(all) fun setValue(newValue: String) {
            if self.validateColor(newValue) {
                let oldColor = self.color
                self.color = newValue
                emit ColorChanged(oldColor: oldColor, newColor: newValue)
            }
        }
        
        access(all) view fun getDisplayName(): String {
            return "Color: ".concat(self.color)
        }
        
        access(all) fun evolve(seed: UInt64): String {
            let oldColor = self.color
            let randomIndex = Int(seed % UInt64(ColorModule.COLORS.length))
            let newColor = ColorModule.COLORS[randomIndex]
            
            self.color = newColor
            emit ColorEvolved(oldColor: oldColor, newColor: newColor, seed: seed)
            return newColor
        }
        
        access(self) fun validateColor(_ color: String): Bool {
            for validColor in ColorModule.COLORS {
                if validColor == color {
                    return true
                }
            }
            return false
        }
    }
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create ColorTrait(initialColor: "Red")
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        return <- create ColorTrait(initialColor: value)
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Simple inheritance: randomly pick from one parent
        let parentChoice = seed % 2
        let inheritedColor = parentChoice == 0 ? parent1.getValue() : parent2.getValue()
        
        // Small chance of mutation
        if seed % 100 < 10 { // 10% mutation chance
            let mutationIndex = Int((seed / 100) % UInt64(self.COLORS.length))
            let mutatedColor = self.COLORS[mutationIndex]
            return <- create ColorTrait(initialColor: mutatedColor)
        }
        
        return <- create ColorTrait(initialColor: inheritedColor)
    }
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String {
        return "color"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        self.COLORS = [
            "Red", "Blue", "Green", "Yellow", "Purple", 
            "Orange", "Pink", "Cyan", "Magenta", "Lime"
        ]
    }
} 