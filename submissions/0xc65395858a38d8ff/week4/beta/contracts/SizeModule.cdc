// SizeModule.cdc
// Example implementation of a size trait module

import "TraitModule"

access(all) contract SizeModule: TraitModule {
    
    // === CONSTANTS ===
    access(all) let MIN_SIZE: UInt8
    access(all) let MAX_SIZE: UInt8
    access(all) let SIZE_NAMES: {UInt8: String}
    
    // === EVENTS ===
    access(all) event SizeChanged(oldSize: UInt8, newSize: UInt8)
    access(all) event SizeEvolved(oldSize: UInt8, newSize: UInt8, seed: UInt64)
    
    // === SIZE TRAIT RESOURCE ===
    access(all) resource SizeTrait: TraitModule.Trait {
        access(self) var size: UInt8
        
        init(initialSize: UInt8) {
            self.size = self.clampSize(initialSize)
        }
        
        access(all) view fun getValue(): String {
            return self.size.toString()
        }
        
        access(all) fun setValue(newValue: String) {
            if let newSize = UInt8.fromString(newValue) {
                let oldSize = self.size
                self.size = self.clampSize(newSize)
                emit SizeChanged(oldSize: oldSize, newSize: self.size)
            }
        }
        
        access(all) view fun getDisplayName(): String {
            let sizeName = SizeModule.SIZE_NAMES[self.size] ?? "Unknown"
            return "Size: ".concat(sizeName).concat(" (").concat(self.size.toString()).concat(")")
        }
        
        access(all) fun evolve(seed: UInt64): String {
            let oldSize = self.size
            
            // Evolution: +/- 1 with occasional jumps
            let direction = seed % 100
            var newSize = self.size
            
            if direction < 40 && self.size > SizeModule.MIN_SIZE {
                // Shrink
                newSize = self.size - 1
            } else if direction < 80 && self.size < SizeModule.MAX_SIZE {
                // Grow
                newSize = self.size + 1
            } else if direction < 95 {
                // Random jump
                let randomSize = UInt8(seed % UInt64(SizeModule.MAX_SIZE - SizeModule.MIN_SIZE + 1)) + SizeModule.MIN_SIZE
                newSize = randomSize
            }
            // 5% chance of no change
            
            self.size = newSize
            emit SizeEvolved(oldSize: oldSize, newSize: newSize, seed: seed)
            return newSize.toString()
        }
        
        access(self) fun clampSize(_ size: UInt8): UInt8 {
            if size < SizeModule.MIN_SIZE { return SizeModule.MIN_SIZE }
            if size > SizeModule.MAX_SIZE { return SizeModule.MAX_SIZE }
            return size
        }
        
        access(all) view fun getNumericSize(): UInt8 {
            return self.size
        }
    }
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create SizeTrait(initialSize: 5) // Medium size
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let size = UInt8.fromString(value) ?? 5
        return <- create SizeTrait(initialSize: size)
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Get parent sizes
        let parent1Size = UInt8.fromString(parent1.getValue()) ?? 5
        let parent2Size = UInt8.fromString(parent2.getValue()) ?? 5
        
        // Average with some variance
        let avgSize = (UInt16(parent1Size) + UInt16(parent2Size)) / 2
        let variance = Int(seed % 3) - 1 // -1, 0, or 1
        let childSize = UInt8(Int(avgSize) + variance)
        
        return <- create SizeTrait(initialSize: childSize)
    }
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String {
        return "size"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        self.MIN_SIZE = 1
        self.MAX_SIZE = 10
        
        self.SIZE_NAMES = {
            1: "Tiny",
            2: "Very Small", 
            3: "Small",
            4: "Below Average",
            5: "Medium",
            6: "Above Average", 
            7: "Large",
            8: "Very Large",
            9: "Huge",
            10: "Gigantic"
        }
    }
} 