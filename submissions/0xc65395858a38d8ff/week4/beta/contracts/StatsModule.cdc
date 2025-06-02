// StatsModule.cdc
// Complex module with multiple sub-attributes

import "TraitModule"

access(all) contract StatsModule: TraitModule {
    
    // === CONSTANTS ===
    access(all) let MIN_STAT: UInt8
    access(all) let MAX_STAT: UInt8
    access(all) let STAT_NAMES: [String]
    
    // === EVENTS ===
    access(all) event StatsChanged(oldStats: {String: UInt8}, newStats: {String: UInt8})
    access(all) event StatEvolved(statName: String, oldValue: UInt8, newValue: UInt8, seed: UInt64)
    access(all) event StatsInitialized(strength: UInt8, speed: UInt8, intelligence: UInt8, health: UInt8)
    
    // === COMPLEX STATS TRAIT RESOURCE ===
    access(all) resource StatsTrait: TraitModule.Trait {
        // 🧠 SUB-ATTRIBUTES: Multiple stats in one trait
        access(self) var strength: UInt8
        access(self) var speed: UInt8
        access(self) var intelligence: UInt8
        access(self) var health: UInt8
        
        init(strength: UInt8, speed: UInt8, intelligence: UInt8, health: UInt8) {
            self.strength = StatsModule.clampStat(strength)
            self.speed = StatsModule.clampStat(speed)
            self.intelligence = StatsModule.clampStat(intelligence)
            self.health = StatsModule.clampStat(health)
            
            emit StatsInitialized(
                strength: self.strength,
                speed: self.speed, 
                intelligence: self.intelligence,
                health: self.health
            )
        }
        
        // 📊 VALUE FORMAT: "STR:5|SPD:7|INT:3|HP:8"
        access(all) view fun getValue(): String {
            return "STR:".concat(self.strength.toString())
                .concat("|SPD:").concat(self.speed.toString())
                .concat("|INT:").concat(self.intelligence.toString())
                .concat("|HP:").concat(self.health.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            let oldStats = self.getStatsDict()
            
            // Parse "STR:5|SPD:7|INT:3|HP:8"
            let parts = newValue.split(separator: "|")
            if parts.length == 4 {
                for part in parts {
                    let statParts = part.split(separator: ":")
                    if statParts.length == 2 {
                        let statName = statParts[0]
                        if let statValue = UInt8.fromString(statParts[1]) {
                            let clampedValue = StatsModule.clampStat(statValue)
                            
                            switch statName {
                                case "STR": self.strength = clampedValue
                                case "SPD": self.speed = clampedValue
                                case "INT": self.intelligence = clampedValue
                                case "HP": self.health = clampedValue
                            }
                        }
                    }
                }
                
                let newStats = self.getStatsDict()
                emit StatsChanged(oldStats: oldStats, newStats: newStats)
            }
        }
        
        // 🎮 DISPLAY: Beautiful formatted display
        access(all) view fun getDisplayName(): String {
            return "Stats: 💪".concat(self.strength.toString())
                .concat(" ⚡").concat(self.speed.toString())
                .concat(" 🧠").concat(self.intelligence.toString())
                .concat(" ❤️").concat(self.health.toString())
        }
        
        // 🧬 EVOLUTION: Complex evolution affecting multiple stats
        access(all) fun evolve(seed: UInt64): String {
            let oldStats = self.getStatsDict()
            
            // Each stat has different evolution probability
            // Strength: 25% chance
            if seed % 100 < 25 {
                let change = Int((seed / 10) % 3) - 1  // -1, 0, +1
                self.strength = StatsModule.clampStat(UInt8(Int(self.strength) + change))
                emit StatEvolved(statName: "strength", oldValue: oldStats["strength"]!, newValue: self.strength, seed: seed)
            }
            
            // Speed: 30% chance  
            if (seed / 100) % 100 < 30 {
                let change = Int((seed / 1000) % 3) - 1
                self.speed = StatsModule.clampStat(UInt8(Int(self.speed) + change))
                emit StatEvolved(statName: "speed", oldValue: oldStats["speed"]!, newValue: self.speed, seed: seed)
            }
            
            // Intelligence: 20% chance (rare)
            if (seed / 10000) % 100 < 20 {
                let change = Int((seed / 100000) % 3) - 1
                self.intelligence = StatsModule.clampStat(UInt8(Int(self.intelligence) + change))
                emit StatEvolved(statName: "intelligence", oldValue: oldStats["intelligence"]!, newValue: self.intelligence, seed: seed)
            }
            
            // Health: 35% chance
            if (seed / 1000000) % 100 < 35 {
                let change = Int((seed / 10000000) % 3) - 1
                self.health = StatsModule.clampStat(UInt8(Int(self.health) + change))
                emit StatEvolved(statName: "health", oldValue: oldStats["health"]!, newValue: self.health, seed: seed)
            }
            
            return self.getValue()
        }
        
        // 🔧 HELPER METHODS
        access(self) fun getStatsDict(): {String: UInt8} {
            return {
                "strength": self.strength,
                "speed": self.speed, 
                "intelligence": self.intelligence,
                "health": self.health
            }
        }
        
        // 📈 PUBLIC ACCESSORS
        access(all) view fun getStrength(): UInt8 { return self.strength }
        access(all) view fun getSpeed(): UInt8 { return self.speed }
        access(all) view fun getIntelligence(): UInt8 { return self.intelligence }
        access(all) view fun getHealth(): UInt8 { return self.health }
        access(all) view fun getTotalStats(): UInt16 { 
            return UInt16(self.strength) + UInt16(self.speed) + UInt16(self.intelligence) + UInt16(self.health)
        }
    }
    
    // === FACTORY METHODS ===
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        // Balanced default stats
        return <- create StatsTrait(strength: 5, speed: 5, intelligence: 5, health: 5)
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        // Parse "STR:5|SPD:7|INT:3|HP:8"
        var str: UInt8 = 5
        var spd: UInt8 = 5
        var int: UInt8 = 5
        var hp: UInt8 = 5
        
        let parts = value.split(separator: "|")
        if parts.length == 4 {
            for part in parts {
                let statParts = part.split(separator: ":")
                if statParts.length == 2 {
                    let statName = statParts[0]
                    if let statValue = UInt8.fromString(statParts[1]) {
                        switch statName {
                            case "STR": str = statValue
                            case "SPD": spd = statValue
                            case "INT": int = statValue
                            case "HP": hp = statValue
                        }
                    }
                }
            }
        }
        
        return <- create StatsTrait(strength: str, speed: spd, intelligence: int, health: hp)
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Complex inheritance: each stat from random parent + mutation
        let p1Value = parent1.getValue()
        let p2Value = parent2.getValue()
        
        // Parse both parents
        let p1Stats = self.parseStatsValue(p1Value)
        let p2Stats = self.parseStatsValue(p2Value)
        
        // Inherit each stat randomly with slight mutation
        let inheritStr = (seed % 2 == 0) ? p1Stats["strength"]! : p2Stats["strength"]!
        let inheritSpd = ((seed / 10) % 2 == 0) ? p1Stats["speed"]! : p2Stats["speed"]!
        let inheritInt = ((seed / 100) % 2 == 0) ? p1Stats["intelligence"]! : p2Stats["intelligence"]!
        let inheritHp = ((seed / 1000) % 2 == 0) ? p1Stats["health"]! : p2Stats["health"]!
        
        // Add small mutations (±1)
        let mutationStr = Int((seed / 10000) % 3) - 1
        let mutationSpd = Int((seed / 100000) % 3) - 1
        let mutationInt = Int((seed / 1000000) % 3) - 1
        let mutationHp = Int((seed / 10000000) % 3) - 1
        
        let childStr = self.clampStat(UInt8(Int(inheritStr) + mutationStr))
        let childSpd = self.clampStat(UInt8(Int(inheritSpd) + mutationSpd))
        let childInt = self.clampStat(UInt8(Int(inheritInt) + mutationInt))
        let childHp = self.clampStat(UInt8(Int(inheritHp) + mutationHp))
        
        return <- create StatsTrait(strength: childStr, speed: childSpd, intelligence: childInt, health: childHp)
    }
    
    // === UTILITY FUNCTIONS ===
    access(all) view fun clampStat(_ value: UInt8): UInt8 {
        if value < self.MIN_STAT { return self.MIN_STAT }
        if value > self.MAX_STAT { return self.MAX_STAT }
        return value
    }
    
    access(all) fun parseStatsValue(_ value: String): {String: UInt8} {
        var stats: {String: UInt8} = {"strength": 5, "speed": 5, "intelligence": 5, "health": 5}
        
        let parts = value.split(separator: "|")
        if parts.length == 4 {
            for part in parts {
                let statParts = part.split(separator: ":")
                if statParts.length == 2 {
                    let statName = statParts[0]
                    if let statValue = UInt8.fromString(statParts[1]) {
                        switch statName {
                            case "STR": stats["strength"] = statValue
                            case "SPD": stats["speed"] = statValue
                            case "INT": stats["intelligence"] = statValue
                            case "HP": stats["health"] = statValue
                        }
                    }
                }
            }
        }
        
        return stats
    }
    
    // === MODULE IDENTITY ===
    access(all) view fun getModuleType(): String {
        return "stats"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        self.MIN_STAT = 1
        self.MAX_STAT = 10
        self.STAT_NAMES = ["strength", "speed", "intelligence", "health"]
    }
} 