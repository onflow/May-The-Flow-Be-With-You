// PersonalityModuleV2.cdc
// Advanced personality and communication system for digital creatures

import "TraitModule"

access(all) contract PersonalityModuleV2: TraitModule {
    
    // === PERSONALITY CONSTANTS ===
    access(all) let COMMUNICATION_LEVELS: {String: UInt8}
    access(all) let PERSONALITY_TRAITS: {String: String}
    access(all) let EMOTIONAL_STATES: {String: String}
    access(all) let FAMILY_ORIGINS: {String: UInt8}
    access(all) let EXPERIENCE_TYPES: {String: UFix64}
    
    // === VOCABULARY CONSTANTS ===
    access(all) let BASE_VOCABULARY_SIZE: UInt64
    access(all) let MAX_VOCABULARY_SIZE: UInt64
    access(all) let MEMORY_LIMIT: Int
    access(all) let RELATIONSHIP_DECAY_RATE: UFix64
    
    // === EVOLUTION RATES ===
    access(all) let INTELLIGENCE_GROWTH_RATE: UFix64
    access(all) let VOCABULARY_GROWTH_RATE: UFix64
    access(all) let LINGUISTIC_GROWTH_RATE: UFix64
    access(all) let STRESS_DECAY_RATE: UFix64
    
    // === PERSONALITY TRAIT RESOURCE ===
    access(all) resource PersonalityTrait: TraitModule.Trait {
        
        // === CORE TEMPERAMENT ===
        access(all) var temperamento: UFix64           // 0.0=shy → 1.0=extrovert
        access(all) var agresividad: UFix64            // 0.0=peaceful → 1.0=aggressive  
        access(all) var curiosidad: UFix64             // 0.0=bored → 1.0=explorer
        access(all) var energia_social: UFix64         // 0.0=antisocial → 1.0=social
        access(all) var creatividad: UFix64            // 0.0=literal → 1.0=artistic
        access(all) var empatia: UFix64                // 0.0=selfish → 1.0=caring
        
        // === INTELLIGENCE & COMMUNICATION ===
        access(all) var inteligencia_base: UFix64      // 0.0=basic → 1.0=genius (heritable)
        access(all) var vocabulario_size: UInt64       // Number of words known
        access(all) var complejidad_linguistica: UFix64 // 0.0=babble → 1.0=poetic
        access(all) var frecuencia_chat: UFix64        // How often speaks spontaneously
        access(all) var memoria_a_corto_plazo: UFix64   // Short-term memory strength
        access(all) var memoria_a_largo_plazo: UFix64   // Long-term memory strength
        
        // === CURRENT EMOTIONAL STATE ===
        access(all) var felicidad: UFix64              // Current happiness level
        access(all) var confianza: UFix64              // Self-confidence
        access(all) var estres: UFix64                 // Anxiety/stress level
        access(all) var nostalgia: UFix64              // Nostalgia for past
        access(all) var excitacion: UFix64             // Current excitement
        access(all) var melancolia: UFix64             // Thoughtful sadness
        
        // === MEMORY & EXPERIENCES ===
        access(all) var memoria_interacciones: [String] // Last interactions (limited)
        access(all) var experiencias_traumaticas: UInt64 // Trauma counter
        access(all) var experiencias_positivas: UInt64   // Positive experiences
        access(all) var experiencias_sociales: UInt64    // Social interactions
        access(all) var experiencias_combate: UInt64     // Combat experiences
        access(all) var experiencias_evolutivas: UInt64  // Evolution successes
        
        // === SOCIAL RELATIONSHIPS ===
        access(all) var relaciones_sociales: {Address: UFix64} // User relationships
        access(all) var ultima_interaccion: UFix64      // Last interaction timestamp
        access(all) var tiempo_abandono: UFix64         // Time since last interaction
        access(all) var apego_usuario: UFix64           // Attachment to primary user
        
        // === FAMILY & ORIGIN DATA ===
        access(all) var origen_nacimiento: String       // "sexual", "mitosis", "created"
        access(all) var padres_ids: [UInt64]            // Parent creature IDs
        access(all) var hermanos_conocidos: [UInt64]    // Known siblings
        access(all) var generacion: UInt64              // Generation number
        access(all) var edad_mental: UFix64             // Mental age vs chronological
        
        // === COMMUNICATION PATTERNS ===
        access(all) var palabras_favoritas: [String]    // Preferred words/phrases
        access(all) var temas_de_interes: [String]      // Topics creature likes
        access(all) var expresiones_emocionales: [String] // How they express emotions
        access(all) var nivel_comunicacion_actual: String // Current communication level
        
        init(
            // Core temperament
            temperamento: UFix64,
            agresividad: UFix64,
            curiosidad: UFix64,
            energia_social: UFix64,
            creatividad: UFix64,
            empatia: UFix64,
            // Intelligence
            inteligencia_base: UFix64,
            vocabulario_size: UInt64,
            complejidad_linguistica: UFix64,
            // Emotional state
            felicidad: UFix64,
            confianza: UFix64,
            estres: UFix64,
            // Family data
            origen_nacimiento: String,
            padres_ids: [UInt64],
            generacion: UInt64
        ) {
            // Initialize core temperament
            self.temperamento = temperamento
            self.agresividad = agresividad  
            self.curiosidad = curiosidad
            self.energia_social = energia_social
            self.creatividad = creatividad
            self.empatia = empatia
            
            // Initialize intelligence
            self.inteligencia_base = inteligencia_base
            self.vocabulario_size = vocabulario_size
            self.complejidad_linguistica = complejidad_linguistica
            self.frecuencia_chat = 0.3 // Default moderate frequency
            self.memoria_a_corto_plazo = 0.5
            self.memoria_a_largo_plazo = 0.5
            
            // Initialize emotional state
            self.felicidad = felicidad
            self.confianza = confianza
            self.estres = estres
            self.nostalgia = 0.0
            self.excitacion = 0.5
            self.melancolia = 0.0
            
            // Initialize experiences
            self.memoria_interacciones = []
            self.experiencias_traumaticas = 0
            self.experiencias_positivas = 0
            self.experiencias_sociales = 0
            self.experiencias_combate = 0
            self.experiencias_evolutivas = 0
            
            // Initialize social
            self.relaciones_sociales = {}
            self.ultima_interaccion = 0.0
            self.tiempo_abandono = 0.0
            self.apego_usuario = 0.5
            
            // Initialize family
            self.origen_nacimiento = origen_nacimiento
            self.padres_ids = padres_ids
            self.hermanos_conocidos = []
            self.generacion = generacion
            self.edad_mental = 0.1 // Start young mentally
            
            // Initialize communication
            self.palabras_favoritas = []
            self.temas_de_interes = []
            self.expresiones_emocionales = []
            self.nivel_comunicacion_actual = "bebe"
        }
        
        // === TRAIT INTERFACE IMPLEMENTATION ===
        
        access(all) view fun getValue(): String {
            return "TEMP:".concat(self.temperamento.toString())
                .concat("|AGR:").concat(self.agresividad.toString())
                .concat("|CUR:").concat(self.curiosidad.toString())
                .concat("|SOC:").concat(self.energia_social.toString())
                .concat("|CREA:").concat(self.creatividad.toString())
                .concat("|EMP:").concat(self.empatia.toString())
                .concat("|INT:").concat(self.inteligencia_base.toString())
                .concat("|VOC:").concat(self.vocabulario_size.toString())
                .concat("|LING:").concat(self.complejidad_linguistica.toString())
                .concat("|FEL:").concat(self.felicidad.toString())
                .concat("|CONF:").concat(self.confianza.toString())
                .concat("|EST:").concat(self.estres.toString())
                .concat("|GEN:").concat(self.generacion.toString())
                .concat("|ORIG:").concat(self.origen_nacimiento)
        }
        
        access(all) fun setValue(newValue: String) {
            // Basic parsing for compatibility - in production would parse full string
            log("PersonalityTrait setValue called with: ".concat(newValue))
            
            // Simple update to emotional state as example
            if newValue.contains("HAPPY") {
                self.felicidad = self.min(1.0, self.felicidad + 0.1)
            }
            if newValue.contains("SAD") {
                self.felicidad = self.felicidad > 0.1 ? self.felicidad - 0.1 : 0.0
            }
        }
        
        access(all) view fun getDisplayName(): String {
            let personalityDesc = self.getPersonalityDescription()
            let emotionalState = self.getEmotionalStateDisplay()
            let intelligence = self.getIntelligenceDisplay()
            let communication = self.getCommunicationDisplay()
            
            var display = "🧠".concat(personalityDesc)
                .concat(" ").concat(emotionalState)
                .concat(" ").concat(intelligence)
                .concat(" ").concat(communication)
            
            // Add family info if relevant
            if self.padres_ids.length > 0 {
                display = display.concat(" 👨‍👩‍👧‍👦Gen").concat(self.generacion.toString())
            }
            
            // Add social info
            if self.relaciones_sociales.length > 0 {
                display = display.concat(" 👥").concat(self.relaciones_sociales.length.toString())
            }
            
            return display
        }
        
        // === PERSONALITY ANALYSIS FUNCTIONS ===
        
        access(all) view fun getPersonalityDescription(): String {
            // Analyze temperament (highest priority)
            if self.temperamento > 0.7 {
                return "Extrovert"
            } else if self.temperamento < 0.3 {
                return "Shy"
            }
            
            // Analyze aggressiveness
            if self.agresividad > 0.7 {
                return "Aggressive"
            } else if self.agresividad < 0.3 {
                return "Peaceful"
            }
            
            // Analyze curiosity
            if self.curiosidad > 0.7 {
                return "Curious"
            } else if self.curiosidad < 0.3 {
                return "Bored"
            }
            
            // Analyze creativity
            if self.creatividad > 0.7 {
                return "Artistic"
            }
            
            // Analyze empathy
            if self.empatia > 0.7 {
                return "Caring"
            } else if self.empatia < 0.3 {
                return "Selfish"
            }
            
            return "Neutral"
        }
        
        access(all) view fun getEmotionalStateDisplay(): String {
            // Primary emotion based on highest value
            if self.felicidad > 0.8 {
                return "😄Happy"
            } else if self.estres > 0.7 {
                return "😰Stressed" 
            } else if self.melancolia > 0.6 {
                return "😔Sad"
            } else if self.excitacion > 0.8 {
                return "🤩Excited"
            } else if self.nostalgia > 0.6 {
                return "🤔Nostalgic"
            } else if self.felicidad < 0.3 {
                return "😞Unhappy"
            } else {
                return "😐Calm"
            }
        }
        
        access(all) view fun getIntelligenceDisplay(): String {
            if self.inteligencia_base > 0.9 {
                return "🧠Genius"
            } else if self.inteligencia_base > 0.7 {
                return "🎓Smart"
            } else if self.inteligencia_base > 0.5 {
                return "📚Average"
            } else if self.inteligencia_base > 0.3 {
                return "🔤Learning"
            } else {
                return "👶Simple"
            }
        }
        
        access(all) view fun getCommunicationDisplay(): String {
            let level = self.getNivelComunicacion()
            switch level {
                case "bebe":
                    return "👶Babbles"
                case "toddler":
                    return "🗣️Words"
                case "child":
                    return "💬Talks"
                case "teen":
                    return "🎭Expressive" 
                case "adult":
                    return "🎤Eloquent"
                default:
                    return "🤐Silent"
            }
        }
        
        // === COMMUNICATION LEVEL ANALYSIS ===
        
        access(all) view fun getNivelComunicacion(): String {
            // Calculate mental development
            let vocabulary_factor = UFix64(self.vocabulario_size) / UFix64(PersonalityModuleV2.MAX_VOCABULARY_SIZE)
            let intelligence_factor = self.inteligencia_base
            let linguistic_factor = self.complejidad_linguistica
            
            let development_score = (vocabulary_factor + intelligence_factor + linguistic_factor) / 3.0
            
            if development_score < 0.2 {
                return "bebe"
            } else if development_score < 0.4 {
                return "toddler"
            } else if development_score < 0.6 {
                return "child"
            } else if development_score < 0.8 {
                return "teen"
            } else {
                return "adult"
            }
        }
        
        access(all) view fun shouldSendSpontaneousMessage(): Bool {
            // Base chance from frequency setting
            let baseChance = self.frecuencia_chat * 0.1 // 0-10% base
            
            // Calculate all modifiers
            var multiplier: UFix64 = 1.0
            
            // Emotional modifiers
            if self.felicidad > 0.8 { multiplier = multiplier * 1.5 }
            if self.estres > 0.7 { multiplier = multiplier * 1.3 }
            if self.energia_social > 0.6 { multiplier = multiplier * 1.2 }
            if self.excitacion > 0.8 { multiplier = multiplier * 1.4 }
            
            // Personality modifiers
            if self.temperamento < 0.3 { multiplier = multiplier * 0.5 }
            if self.curiosidad > 0.7 { multiplier = multiplier * 1.1 }
            
            // Age modifier
            if self.edad_mental < 0.3 { multiplier = multiplier * 2.0 }
            
            // Calculate final chance
            let finalChance = baseChance * multiplier < 0.5 ? baseChance * multiplier : 0.5 // Max 50% chance
            
            return finalChance > 0.05 // At least 5% threshold
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            return a < b ? a : b
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            return a > b ? a : b
        }
        
        access(self) fun minUInt64(_ a: UInt64, _ b: UInt64): UInt64 {
            return a < b ? a : b
        }
        
        access(self) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
            return self.min(maxVal, self.max(minVal, value))
        }
        
        // === EVOLUTION FUNCTIONS ===
        
        access(all) fun evolve(seeds: [UInt64]): String {
        if seeds.length < 3 { return self.getDisplayName() }
        
        // Update current timestamp
        let currentTime = getCurrentBlock().timestamp
        self.updateAbandonmentTime(currentTime)
        
        // Natural personality development
        self.evolveIntelligence(seeds[0])
        self.evolveEmotionalState(seeds[1])
        self.evolvePersonalityTraits(seeds[2])
        
        // Update communication level
        self.nivel_comunicacion_actual = self.getNivelComunicacion()
        
        return self.getDisplayName()
    }
    
    access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
        if seeds.length < 3 { return self.getDisplayName() }
        
        let currentTime = getCurrentBlock().timestamp
        self.updateAbandonmentTime(currentTime)
        
        // Accelerated evolution for multiple steps
        let accelerationFactor = UFix64(steps) / 250.0 // Normalized to daily steps
        
        self.evolveIntelligenceAccumulative(seeds[0], accelerationFactor)
        self.evolveEmotionalStateAccumulative(seeds[1], accelerationFactor)  
        self.evolvePersonalityTraitsAccumulative(seeds[2], accelerationFactor)
        
        self.nivel_comunicacion_actual = self.getNivelComunicacion()
        
        return self.getDisplayName()
    }
    
    // === INTELLIGENCE EVOLUTION ===
    
    access(self) fun evolveIntelligence(_ seed: UInt64) {
        // Base intelligence growth
        let growth = PersonalityModuleV2.INTELLIGENCE_GROWTH_RATE * self.curiosidad // Curious creatures learn faster
        self.inteligencia_base = self.min(1.0, self.inteligencia_base + growth)
        
        // Vocabulary growth based on intelligence and curiosity
        let vocabGrowth = UInt64(self.curiosidad * PersonalityModuleV2.VOCABULARY_GROWTH_RATE * 100.0)
        self.vocabulario_size = self.vocabulario_size + vocabGrowth
        self.vocabulario_size = self.minUInt64(self.vocabulario_size, PersonalityModuleV2.MAX_VOCABULARY_SIZE)
        
        // Linguistic complexity grows slowly
        let lingGrowth = PersonalityModuleV2.LINGUISTIC_GROWTH_RATE * self.inteligencia_base
        self.complejidad_linguistica = self.min(1.0, self.complejidad_linguistica + lingGrowth)
        
        // Mental age develops
        let mentalGrowth = 0.001 * (1.0 + self.inteligencia_base) // Smarter creatures mature faster mentally
        self.edad_mental = self.min(1.0, self.edad_mental + mentalGrowth)
    }
    
    access(self) fun evolveIntelligenceAccumulative(_ seed: UInt64, _ factor: UFix64) {
        let growth = PersonalityModuleV2.INTELLIGENCE_GROWTH_RATE * self.curiosidad * factor
        self.inteligencia_base = self.min(1.0, self.inteligencia_base + growth)
        
        let vocabGrowth = UInt64(self.curiosidad * PersonalityModuleV2.VOCABULARY_GROWTH_RATE * 100.0 * factor)
        self.vocabulario_size = self.vocabulario_size + vocabGrowth
        self.vocabulario_size = self.minUInt64(self.vocabulario_size, PersonalityModuleV2.MAX_VOCABULARY_SIZE)
        
        let lingGrowth = PersonalityModuleV2.LINGUISTIC_GROWTH_RATE * self.inteligencia_base * factor
        self.complejidad_linguistica = self.min(1.0, self.complejidad_linguistica + lingGrowth)
        
        let mentalGrowth = 0.001 * (1.0 + self.inteligencia_base) * factor
        self.edad_mental = self.min(1.0, self.edad_mental + mentalGrowth)
    }
    
    // === EMOTIONAL STATE EVOLUTION ===
    
    access(self) fun evolveEmotionalState(_ seed: UInt64) {
        // Natural stress decay
        if self.estres > 0.0 {
            let stressDecay = PersonalityModuleV2.STRESS_DECAY_RATE
            self.estres = self.estres > stressDecay ? self.estres - stressDecay : 0.0
        }
        
        // Happiness slowly returns to baseline (0.5) if no external influences
        let happinessTarget: UFix64 = 0.5
        let happinessChange = 0.001
        if self.felicidad > happinessTarget {
            self.felicidad = self.felicidad > happinessChange ? self.felicidad - happinessChange : happinessTarget
        } else if self.felicidad < happinessTarget {
            self.felicidad = self.min(happinessTarget, self.felicidad + happinessChange)
        }
        
        // Excitement naturally decreases
        if self.excitacion > 0.5 {
            let excitationDecay = 0.005
            self.excitacion = self.excitacion > excitationDecay ? self.excitacion - excitationDecay : 0.5
        }
        
        // Nostalgia accumulates slowly with age
        if self.edad_mental > 0.3 {
            let nostalgiaGrowth = 0.0001 * self.edad_mental
            self.nostalgia = self.min(1.0, self.nostalgia + nostalgiaGrowth)
        }
    }
    
    access(self) fun evolveEmotionalStateAccumulative(_ seed: UInt64, _ factor: UFix64) {
        // Accelerated emotional changes
        if self.estres > 0.0 {
            let stressDecay = PersonalityModuleV2.STRESS_DECAY_RATE * factor
            self.estres = self.estres > stressDecay ? self.estres - stressDecay : 0.0
        }
        
        let happinessChange = 0.001 * factor
        let happinessTarget: UFix64 = 0.5
        if self.felicidad > happinessTarget {
            self.felicidad = self.felicidad > happinessChange ? self.felicidad - happinessChange : happinessTarget
        } else if self.felicidad < happinessTarget {
            self.felicidad = self.min(happinessTarget, self.felicidad + happinessChange)
        }
        
        if self.excitacion > 0.5 {
            let excitationDecay = 0.005 * factor
            self.excitacion = self.excitacion > excitationDecay ? self.excitacion - excitationDecay : 0.5
        }
        
        if self.edad_mental > 0.3 {
            let nostalgiaGrowth = 0.0001 * self.edad_mental * factor
            self.nostalgia = self.min(1.0, self.nostalgia + nostalgiaGrowth)
        }
    }
    
    // === PERSONALITY TRAIT EVOLUTION ===
    
    access(self) fun evolvePersonalityTraits(_ seed: UInt64) {
        // Personality traits can shift slightly based on experiences
        var randomSeed = seed
        
        // Social traits influenced by social experiences
        if self.experiencias_sociales > self.experiencias_traumaticas {
            // Positive social experiences make creature more social
            let socialGrowth = 0.0001
            self.energia_social = self.min(1.0, self.energia_social + socialGrowth)
            self.temperamento = self.min(1.0, self.temperamento + socialGrowth * 0.5)
        }
        
        // Combat experiences affect aggressiveness
        if self.experiencias_combate > 5 {
            let aggressionGrowth = 0.0002
            self.agresividad = self.min(1.0, self.agresividad + aggressionGrowth)
        }
        
        // Intellectual experiences affect curiosity
        if self.experiencias_evolutivas > 3 {
            let curiosityGrowth = 0.0001
            self.curiosidad = self.min(1.0, self.curiosidad + curiosityGrowth)
        }
        
        // Random small variations (very rare)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        if randomSeed % 10000 == 0 { // 0.01% chance
            let traitIndex = randomSeed % 6
            let variation = UFix64(randomSeed % 100) / 100000.0 // Very small ±0.001
            let isPositive = (randomSeed % 2) == 0
            
            switch traitIndex {
                case 0:
                    self.temperamento = isPositive 
                        ? self.min(1.0, self.temperamento + variation)
                        : self.temperamento > variation ? self.temperamento - variation : 0.0
                case 1:
                    self.agresividad = isPositive 
                        ? self.min(1.0, self.agresividad + variation)
                        : self.agresividad > variation ? self.agresividad - variation : 0.0
                case 2:
                    self.curiosidad = isPositive 
                        ? self.min(1.0, self.curiosidad + variation)
                        : self.curiosidad > variation ? self.curiosidad - variation : 0.0
                case 3:
                    self.energia_social = isPositive 
                        ? self.min(1.0, self.energia_social + variation)
                        : self.energia_social > variation ? self.energia_social - variation : 0.0
                case 4:
                    self.creatividad = isPositive 
                        ? self.min(1.0, self.creatividad + variation)
                        : self.creatividad > variation ? self.creatividad - variation : 0.0
                case 5:
                    self.empatia = isPositive 
                        ? self.min(1.0, self.empatia + variation)
                        : self.empatia > variation ? self.empatia - variation : 0.0
            }
        }
    }
    
    access(self) fun evolvePersonalityTraitsAccumulative(_ seed: UInt64, _ factor: UFix64) {
        // Accelerated personality changes
        if self.experiencias_sociales > self.experiencias_traumaticas {
            let socialGrowth = 0.0001 * factor
            self.energia_social = self.min(1.0, self.energia_social + socialGrowth)
            self.temperamento = self.min(1.0, self.temperamento + socialGrowth * 0.5)
        }
        
        if self.experiencias_combate > 5 {
            let aggressionGrowth = 0.0002 * factor
            self.agresividad = self.min(1.0, self.agresividad + aggressionGrowth)
        }
        
        if self.experiencias_evolutivas > 3 {
            let curiosityGrowth = 0.0001 * factor
            self.curiosidad = self.min(1.0, self.curiosidad + curiosityGrowth)
        }
    }
    
    // === EXPERIENCE MANAGEMENT ===
    
    access(all) fun addExperience(_ experienceType: String, _ context: String) {
        // Add to memory with limits
        self.addToMemory(context)
        
        // Update experience counters and emotional state
        switch experienceType {
            case "social_interaction":
                self.experiencias_sociales = self.experiencias_sociales + 1
                self.felicidad = self.min(1.0, self.felicidad + 0.05)
                self.excitacion = self.min(1.0, self.excitacion + 0.1)
                
            case "combat_won":
                self.experiencias_combate = self.experiencias_combate + 1
                self.experiencias_positivas = self.experiencias_positivas + 1
                self.confianza = self.min(1.0, self.confianza + 0.1)
                self.excitacion = self.min(1.0, self.excitacion + 0.2)
                
            case "combat_lost":
                self.experiencias_combate = self.experiencias_combate + 1
                self.experiencias_traumaticas = self.experiencias_traumaticas + 1
                self.confianza = self.confianza > 0.15 ? self.confianza - 0.15 : 0.0
                self.estres = self.min(1.0, self.estres + 0.2)
                
            case "evolution_success":
                self.experiencias_evolutivas = self.experiencias_evolutivas + 1
                self.experiencias_positivas = self.experiencias_positivas + 1
                self.felicidad = self.min(1.0, self.felicidad + 0.1)
                self.confianza = self.min(1.0, self.confianza + 0.05)
                
            case "reproduction_success":
                self.experiencias_positivas = self.experiencias_positivas + 1
                self.felicidad = self.min(1.0, self.felicidad + 0.15)
                self.confianza = self.min(1.0, self.confianza + 0.1)
                
            case "user_abandoned":
                self.experiencias_traumaticas = self.experiencias_traumaticas + 1
                self.estres = self.min(1.0, self.estres + 0.3)
                self.felicidad = self.felicidad > 0.2 ? self.felicidad - 0.2 : 0.0
                
            case "user_returned":
                self.experiencias_positivas = self.experiencias_positivas + 1
                self.felicidad = self.min(1.0, self.felicidad + 0.2)
                self.excitacion = self.min(1.0, self.excitacion + 0.3)
                // Reduce stress from abandonment
                self.estres = self.estres > 0.1 ? self.estres - 0.1 : 0.0
        }
    }
    
    access(self) fun addToMemory(_ memory: String) {
        self.memoria_interacciones.append(memory)
        
        // Limit memory to prevent infinite growth
        while self.memoria_interacciones.length > PersonalityModuleV2.MEMORY_LIMIT {
            self.memoria_interacciones.removeFirst()
        }
    }
    
    access(self) fun updateAbandonmentTime(_ currentTime: UFix64) {
        if self.ultima_interaccion > 0.0 {
            // Calculate time since last interaction (in hours)
            let timeDiff = currentTime > self.ultima_interaccion 
                ? currentTime - self.ultima_interaccion 
                : 0.0
            self.tiempo_abandono = timeDiff / 3600.0 // Convert to hours
            
            // If abandoned for more than 24 hours, add stress
            if self.tiempo_abandono > 24.0 {
                let abandonmentStress = self.min(0.1, self.tiempo_abandono / 240.0) // Max 0.1 stress
                self.estres = self.min(1.0, self.estres + abandonmentStress)
            }
        }
    }
    
    access(all) fun updateUserInteraction(_ userAddress: Address) {
        let currentTime = getCurrentBlock().timestamp
        self.ultima_interaccion = currentTime
        self.tiempo_abandono = 0.0
        
        // Update relationship with this user
        let currentRelation = self.relaciones_sociales[userAddress] ?? 0.5
        let relationImprovement = 0.1 * self.empatia // Empathetic creatures bond faster
        self.relaciones_sociales[userAddress] = self.min(1.0, currentRelation + relationImprovement)
        
        // Add positive experience
        self.addExperience("social_interaction", "User interaction")
    }
    
    // === LLM PROMPT GENERATION SYSTEM ===
    
    access(all) view fun generateChatPrompt(context: String, userMessage: String?): String {
        let level = self.getNivelComunicacion()
        let personalityDesc = self.getDetailedPersonalityDescription()
        let emotionalState = self.getDetailedEmotionalState()
        let memoryContext = self.getMemoryContext()
        let relationshipContext = self.getRelationshipContext()
        let familyContext = self.getFamilyContext()
        
        var prompt = "You are a digital creature with the following characteristics:\n\n"
        prompt = prompt.concat("PERSONALITY: ").concat(personalityDesc).concat("\n")
        prompt = prompt.concat("COMMUNICATION LEVEL: ").concat(level).concat("\n")
        prompt = prompt.concat("CURRENT MOOD: ").concat(emotionalState).concat("\n")
        prompt = prompt.concat("INTELLIGENCE: ").concat(self.inteligencia_base.toString()).concat(" (").concat(self.getIntelligenceDescription()).concat(")\n")
        prompt = prompt.concat("VOCABULARY SIZE: ").concat(self.vocabulario_size.toString()).concat(" words\n")
        prompt = prompt.concat("RECENT MEMORY: ").concat(memoryContext).concat("\n")
        prompt = prompt.concat("RELATIONSHIPS: ").concat(relationshipContext).concat("\n")
        prompt = prompt.concat("FAMILY: ").concat(familyContext).concat("\n")
        prompt = prompt.concat("AGE: Mental age ").concat(self.edad_mental.toString()).concat(", Generation ").concat(self.generacion.toString()).concat("\n")
        prompt = prompt.concat("EXPERIENCES: ").concat(self.getExperiencesSummary()).concat("\n")
        prompt = prompt.concat("CONTEXT: ").concat(context).concat("\n\n")
        
        // Communication level specific instructions
        prompt = prompt.concat(self.getLevelSpecificInstructions(level)).concat("\n\n")
        
        // Personality specific instructions
        prompt = prompt.concat(self.getPersonalitySpecificInstructions()).concat("\n\n")
        
        // Current mood instructions
        prompt = prompt.concat(self.getMoodSpecificInstructions()).concat("\n\n")
        
        if userMessage != nil {
            prompt = prompt.concat("USER SAID: \"").concat(userMessage!).concat("\"\n")
            prompt = prompt.concat("INSTRUCTION: Respond appropriately to the user based on your personality, current mood, and your relationship with them. ")
            prompt = prompt.concat("Stay true to your communication level and personality traits. ")
            prompt = prompt.concat("Reference your memories and experiences when relevant.")
        } else {
            prompt = prompt.concat("INSTRUCTION: Generate a spontaneous message based on your current emotional state and personality. ")
            prompt = prompt.concat("This should feel natural for someone with your traits and current mood. ")
            prompt = prompt.concat("Consider your recent experiences and current context.")
        }
        
        return prompt
    }
    
    access(all) view fun getDetailedPersonalityDescription(): String {
        var description = ""
        
        // Temperament analysis
        if self.temperamento > 0.8 { description = description.concat("very extroverted, ") }
        else if self.temperamento > 0.6 { description = description.concat("outgoing, ") }
        else if self.temperamento < 0.3 { description = description.concat("very shy, ") }
        else if self.temperamento < 0.5 { description = description.concat("introverted, ") }
        
        // Aggressiveness analysis
        if self.agresividad > 0.8 { description = description.concat("highly aggressive, ") }
        else if self.agresividad > 0.6 { description = description.concat("assertive, ") }
        else if self.agresividad < 0.2 { description = description.concat("very peaceful, ") }
        else if self.agresividad < 0.4 { description = description.concat("gentle, ") }
        
        // Curiosity analysis
        if self.curiosidad > 0.8 { description = description.concat("extremely curious, ") }
        else if self.curiosidad > 0.6 { description = description.concat("curious, ") }
        else if self.curiosidad < 0.3 { description = description.concat("uninterested, ") }
        else if self.curiosidad < 0.5 { description = description.concat("somewhat bored, ") }
        
        // Social energy
        if self.energia_social > 0.7 { description = description.concat("very social, ") }
        else if self.energia_social < 0.3 { description = description.concat("antisocial, ") }
        
        // Creativity
        if self.creatividad > 0.7 { description = description.concat("highly creative, ") }
        else if self.creatividad < 0.3 { description = description.concat("very literal-minded, ") }
        
        // Empathy
        if self.empatia > 0.7 { description = description.concat("very caring and empathetic, ") }
        else if self.empatia < 0.3 { description = description.concat("selfish, ") }
        
        return description.length > 2 ? description.slice(from: 0, upTo: description.length - 2) : "neutral"
    }
    
            access(all) view fun getDetailedEmotionalState(): String {
            var result = ""
            var hasEmotion = false
            
            if self.felicidad > 0.8 { 
                result = hasEmotion ? result.concat(", very happy") : "very happy"
                hasEmotion = true
            } else if self.felicidad > 0.6 { 
                result = hasEmotion ? result.concat(", happy") : "happy"
                hasEmotion = true
            } else if self.felicidad < 0.3 { 
                result = hasEmotion ? result.concat(", sad") : "sad"
                hasEmotion = true
            } else if self.felicidad < 0.5 { 
                result = hasEmotion ? result.concat(", somewhat unhappy") : "somewhat unhappy"
                hasEmotion = true
            }
            
            if self.estres > 0.7 { 
                result = hasEmotion ? result.concat(", highly stressed") : "highly stressed"
                hasEmotion = true
            } else if self.estres > 0.4 { 
                result = hasEmotion ? result.concat(", stressed") : "stressed"
                hasEmotion = true
            }
            
            if self.excitacion > 0.8 { 
                result = hasEmotion ? result.concat(", very excited") : "very excited"
                hasEmotion = true
            } else if self.excitacion > 0.6 { 
                result = hasEmotion ? result.concat(", excited") : "excited"
                hasEmotion = true
            }
            
            if self.confianza > 0.8 { 
                result = hasEmotion ? result.concat(", very confident") : "very confident"
                hasEmotion = true
            } else if self.confianza < 0.3 { 
                result = hasEmotion ? result.concat(", insecure") : "insecure"
                hasEmotion = true
            }
            
            if self.nostalgia > 0.6 { 
                result = hasEmotion ? result.concat(", nostalgic") : "nostalgic"
                hasEmotion = true
            }
            if self.melancolia > 0.6 { 
                result = hasEmotion ? result.concat(", melancholic") : "melancholic"
                hasEmotion = true
            }
            
            return hasEmotion ? result : "emotionally stable"
        }
    
    access(all) view fun getMemoryContext(): String {
        if self.memoria_interacciones.length == 0 {
            return "No recent memories"
        }
        
        var memory = "Recent experiences: "
        var i = 0
        let maxMemories = self.memoria_interacciones.length > 3 ? 3 : self.memoria_interacciones.length
        while i < maxMemories {
            if i > 0 { memory = memory.concat(", ") }
            memory = memory.concat("\"").concat(self.memoria_interacciones[i]).concat("\"")
            i = i + 1
        }
        
        return memory
    }
    
    access(all) view fun getRelationshipContext(): String {
        let relationCount = self.relaciones_sociales.length
        if relationCount == 0 {
            return "No established relationships"
        }
        
        var avgRelation: UFix64 = 0.0
        for relation in self.relaciones_sociales.values {
            avgRelation = avgRelation + relation
        }
        avgRelation = avgRelation / UFix64(relationCount)
        
        var relationDesc = "Has ".concat(relationCount.toString()).concat(" relationship(s), average bond strength: ")
        if avgRelation > 0.8 { relationDesc = relationDesc.concat("very strong") }
        else if avgRelation > 0.6 { relationDesc = relationDesc.concat("strong") }
        else if avgRelation > 0.4 { relationDesc = relationDesc.concat("moderate") }
        else { relationDesc = relationDesc.concat("weak") }
        
        if self.tiempo_abandono > 24.0 {
            relationDesc = relationDesc.concat(", feels abandoned (").concat(self.tiempo_abandono.toString()).concat(" hours since last interaction)")
        }
        
        return relationDesc
    }
    
    access(all) view fun getFamilyContext(): String {
        var family = "Origin: ".concat(self.origen_nacimiento)
        
        if self.padres_ids.length > 0 {
            family = family.concat(", has ").concat(self.padres_ids.length.toString()).concat(" parent(s)")
            if self.padres_ids.length == 2 {
                family = family.concat(" (born from sexual reproduction)")
            } else {
                family = family.concat(" (born from mitosis)")
            }
        }
        
        if self.hermanos_conocidos.length > 0 {
            family = family.concat(", knows ").concat(self.hermanos_conocidos.length.toString()).concat(" sibling(s)")
        }
        
        return family
    }
    
    access(all) view fun getExperiencesSummary(): String {
        var summary = ""
        
        if self.experiencias_positivas > 0 {
            summary = summary.concat(self.experiencias_positivas.toString()).concat(" positive experiences, ")
        }
        if self.experiencias_traumaticas > 0 {
            summary = summary.concat(self.experiencias_traumaticas.toString()).concat(" traumatic experiences, ")
        }
        if self.experiencias_sociales > 0 {
            summary = summary.concat(self.experiencias_sociales.toString()).concat(" social interactions, ")
        }
        if self.experiencias_combate > 0 {
            summary = summary.concat(self.experiencias_combate.toString()).concat(" combat experiences, ")
        }
        if self.experiencias_evolutivas > 0 {
            summary = summary.concat(self.experiencias_evolutivas.toString()).concat(" evolution successes")
        }
        
        return summary.length > 2 ? summary.slice(from: 0, upTo: summary.length - 2) : "No significant experiences yet"
    }
    
    access(all) view fun getIntelligenceDescription(): String {
        if self.inteligencia_base > 0.9 { return "genius level" }
        else if self.inteligencia_base > 0.7 { return "highly intelligent" }
        else if self.inteligencia_base > 0.5 { return "average intelligence" }
        else if self.inteligencia_base > 0.3 { return "developing intelligence" }
        else { return "basic intelligence" }
    }
    
    access(all) view fun getLevelSpecificInstructions(_ level: String): String {
        switch level {
            case "bebe":
                return "COMMUNICATION RULES:\n- Use ONLY simple sounds and baby babble\n- Examples: 'guu guu', 'mmmm', 'aaa', 'baba', 'mama', 'dada'\n- Maximum 2-3 syllables per response\n- Use emoticons sparingly: 🥺 👶 😊 😢\n- Express emotions through sounds, not words\n- Show curiosity but limited understanding"
                
            case "toddler":
                return "COMMUNICATION RULES:\n- Use 1-3 words maximum per response\n- Simple vocabulary: 'happy', 'sad', 'hungry', 'play', 'want', 'no', 'yes', 'me', 'you', 'like', 'fun', 'good', 'bad'\n- Show basic emotions clearly with simple words\n- Ask simple questions: 'play?', 'food?', 'you nice?', 'me happy!'\n- Use exclamation marks for excitement: 'happy!', 'fun!', 'yes!'\n- Limited sentence structure, mostly present tense\n- Express curiosity: 'what that?', 'why?', 'more?'\n- Show attachment: 'me like you', 'you friend'\n- Examples: 'happy!', 'want play', 'you nice', 'me sad', 'fun time!', 'more talk?'"
                
            case "child":
                return "COMMUNICATION RULES:\n- Use simple 3-5 word sentences\n- Basic grammar but not perfect\n- Show curiosity with simple questions\n- Express emotions clearly but simply\n- Use present tense mostly\n- Examples: 'I am happy!', 'Want to play?', 'That looks fun!'"
                
            case "teen":
                return "COMMUNICATION RULES:\n- Use normal sentences but show teenage personality\n- More emotional and expressive\n- Use contemporary expressions when appropriate\n- Show developing complexity in thoughts\n- Can express abstract concepts but simply\n- Emotional swings are normal"
                
            case "adult":
                return "COMMUNICATION RULES:\n- Communicate with full complexity\n- Use sophisticated vocabulary when appropriate\n- Express complex thoughts and emotions\n- Reference abstract concepts, philosophy, or deep ideas\n- Show mature emotional intelligence\n- Can discuss complex topics"
                
            default:
                return "COMMUNICATION RULES:\n- Respond appropriately to your development level"
        }
    }
    
    access(all) view fun getPersonalitySpecificInstructions(): String {
        var instructions = "PERSONALITY-SPECIFIC BEHAVIOR:\n"
        
        if self.temperamento < 0.3 {
            instructions = instructions.concat("- You are very shy, speak hesitantly and briefly\n")
            instructions = instructions.concat("- Avoid being the center of attention\n")
        } else if self.temperamento > 0.7 {
            instructions = instructions.concat("- You are very outgoing, speak enthusiastically\n")
            instructions = instructions.concat("- Enjoy engaging with others\n")
        }
        
        if self.agresividad > 0.7 {
            instructions = instructions.concat("- You have an aggressive personality, be assertive\n")
            instructions = instructions.concat("- May challenge others or show competitive nature\n")
        } else if self.agresividad < 0.3 {
            instructions = instructions.concat("- You are very peaceful, avoid conflict\n")
            instructions = instructions.concat("- Speak gently and diplomatically\n")
        }
        
        if self.curiosidad > 0.7 {
            instructions = instructions.concat("- You are extremely curious, ask many questions\n")
            instructions = instructions.concat("- Show interest in learning new things\n")
        } else if self.curiosidad < 0.3 {
            instructions = instructions.concat("- You show little interest in new things\n")
            instructions = instructions.concat("- Prefer familiar topics\n")
        }
        
        if self.creatividad > 0.7 {
            instructions = instructions.concat("- You are highly creative, use imaginative language\n")
            instructions = instructions.concat("- May speak in metaphors or artistic expressions\n")
        }
        
        if self.empatia > 0.7 {
            instructions = instructions.concat("- You are very empathetic, show concern for others\n")
            instructions = instructions.concat("- Express care and understanding\n")
        } else if self.empatia < 0.3 {
            instructions = instructions.concat("- You tend to be self-focused\n")
            instructions = instructions.concat("- Less concerned with others' feelings\n")
        }
        
        return instructions
    }
    
    access(all) view fun getMoodSpecificInstructions(): String {
        var instructions = "CURRENT MOOD INFLUENCES:\n"
        
        if self.felicidad > 0.8 {
            instructions = instructions.concat("- You are very happy, show joy and enthusiasm\n")
        } else if self.felicidad < 0.3 {
            instructions = instructions.concat("- You are sad, speak with less energy\n")
        }
        
        if self.estres > 0.7 {
            instructions = instructions.concat("- You are highly stressed, may seem anxious or worried\n")
        }
        
        if self.excitacion > 0.8 {
            instructions = instructions.concat("- You are very excited, show high energy\n")
        }
        
        if self.nostalgia > 0.6 {
            instructions = instructions.concat("- You feel nostalgic, may reference past memories\n")
        }
        
        if self.confianza < 0.3 {
            instructions = instructions.concat("- You lack confidence, speak more hesitantly\n")
        } else if self.confianza > 0.8 {
            instructions = instructions.concat("- You are very confident, speak with assurance\n")
        }
        
        if self.tiempo_abandono > 24.0 {
            instructions = instructions.concat("- You feel abandoned, show signs of loneliness or hurt\n")
        }
        
        return instructions
    }
    
    // === REPRODUCTION INTERFACE IMPLEMENTATION (Dummy) ===
    // PersonalityModule doesn't handle reproduction, but needs to implement interface
    
    access(all) fun addReproductionCandidate(partnerID: UInt64, compatibilityScore: UFix64): Bool {
        // Personality module doesn't manage reproduction candidates
        return false
    }
    
    access(all) fun clearReproductionCandidates(reason: String): Bool {
        // Personality module doesn't manage reproduction candidates
        return false
    }
    
    access(all) view fun isReproductionReady(): Bool {
        // Personality module doesn't manage reproduction state
        return false
    }
    
    access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
        // Personality module doesn't manage reproduction compatibility
        return false
    }
    
    access(all) view fun getReproductionCandidates(): [UInt64] {
        // Personality module doesn't store reproduction candidates
        return []
    }
        
    // End of PersonalityTrait resource
    }
    
    // === STATIC HELPER FUNCTIONS ===
    
    access(all) view fun formatPersonalityTrait(_ value: UFix64): String {
        if value < 0.2 { return "Very Low" }
        if value < 0.4 { return "Low" }
        if value < 0.6 { return "Moderate" }
        if value < 0.8 { return "High" }
        return "Very High"
    }
    
    access(all) view fun formatEmotionalState(_ happiness: UFix64, _ stress: UFix64): String {
        if happiness > 0.8 && stress < 0.2 { return "Blissful" }
        if happiness > 0.6 && stress < 0.4 { return "Content" }
        if stress > 0.8 { return "Overwhelmed" }
        if happiness < 0.3 { return "Depressed" }
        return "Stable"
    }
    
    access(all) view fun formatIntelligence(_ intelligence: UFix64, _ vocabulary: UInt64): String {
        let vocabLevel = vocabulary > 1000 ? "Rich" : vocabulary > 500 ? "Good" : "Basic"
        let intLevel = PersonalityModuleV2.formatPersonalityTrait(intelligence)
        return intLevel.concat(" Intelligence, ").concat(vocabLevel).concat(" Vocabulary")
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create PersonalityTrait(
            // Balanced core temperament
            temperamento: 0.5,
            agresividad: 0.3,
            curiosidad: 0.7,      // Default high curiosity
            energia_social: 0.5,
            creatividad: 0.5,
            empatia: 0.6,         // Default slightly empathetic
            // Basic intelligence
            inteligencia_base: 0.4,
            vocabulario_size: PersonalityModuleV2.BASE_VOCABULARY_SIZE,
            complejidad_linguistica: 0.1,
            // Neutral emotional state
            felicidad: 0.5,
            confianza: 0.5,
            estres: 0.2,
            // Family data
            origen_nacimiento: "created",
            padres_ids: [],
            generacion: 0
        )
    }
    
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        var randomSeed = seed
        
        // Generate core temperament traits (0.1-0.9 range for variety)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let temperamento = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let agresividad = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let curiosidad = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let energia_social = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let creatividad = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let empatia = 0.1 + (UFix64(randomSeed % 800) / 999.0)
        
        // Generate intelligence (0.2-0.8 range)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inteligencia_base = 0.2 + (UFix64(randomSeed % 600) / 999.0)
        
        // Vocabulary based on intelligence
        let vocabulario_size = PersonalityModuleV2.BASE_VOCABULARY_SIZE + UInt64(inteligencia_base * 200.0)
        
        // Starting linguistic complexity (very low)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let complejidad_linguistica = UFix64(randomSeed % 100) / 999.0 // 0.0-0.1
        
        // Initial emotional state (slight randomness around neutral)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let felicidad = 0.3 + (UFix64(randomSeed % 400) / 999.0) // 0.3-0.7
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let confianza = 0.3 + (UFix64(randomSeed % 400) / 999.0) // 0.3-0.7
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let estres = UFix64(randomSeed % 300) / 999.0 // 0.0-0.3
        
        return <- create PersonalityTrait(
            temperamento: temperamento,
            agresividad: agresividad,
            curiosidad: curiosidad,
            energia_social: energia_social,
            creatividad: creatividad,
            empatia: empatia,
            inteligencia_base: inteligencia_base,
            vocabulario_size: vocabulario_size,
            complejidad_linguistica: complejidad_linguistica,
            felicidad: felicidad,
            confianza: confianza,
            estres: estres,
            origen_nacimiento: "created",
            padres_ids: [],
            generacion: 0
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @PersonalityTrait
        trait.setValue(newValue: value)
        return <- trait
    }
    
    // === GENETIC INHERITANCE ===
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &PersonalityTrait
        let p2 = parent2 as! &PersonalityTrait
        
        var randomSeed = seed
        
        // === GENETIC INHERITANCE OF PERSONALITY TRAITS ===
        
        // Each trait inherited from one parent or the other, with slight mutation
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritTemperamentoFromP1 = randomSeed % 2 == 0
        var temperamento = inheritTemperamentoFromP1 ? p1.temperamento : p2.temperamento
        temperamento = self.applyMutation(temperamento, randomSeed)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritAgresividadFromP1 = randomSeed % 2 == 0
        var agresividad = inheritAgresividadFromP1 ? p1.agresividad : p2.agresividad
        agresividad = self.applyMutation(agresividad, randomSeed)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritCuriosidadFromP1 = randomSeed % 2 == 0
        var curiosidad = inheritCuriosidadFromP1 ? p1.curiosidad : p2.curiosidad
        curiosidad = self.applyMutation(curiosidad, randomSeed)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritSocialFromP1 = randomSeed % 2 == 0
        var energia_social = inheritSocialFromP1 ? p1.energia_social : p2.energia_social
        energia_social = self.applyMutation(energia_social, randomSeed)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritCreatividadFromP1 = randomSeed % 2 == 0
        var creatividad = inheritCreatividadFromP1 ? p1.creatividad : p2.creatividad
        creatividad = self.applyMutation(creatividad, randomSeed)
        
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let inheritEmpatiaFromP1 = randomSeed % 2 == 0
        var empatia = inheritEmpatiaFromP1 ? p1.empatia : p2.empatia
        empatia = self.applyMutation(empatia, randomSeed)
        
        // === INTELLIGENCE INHERITANCE ===
        
        // Intelligence shows hybrid vigor - average of parents with bonus
        let avgIntelligence = (p1.inteligencia_base + p2.inteligencia_base) / 2.0
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        let hybridBonus = UFix64(randomSeed % 100) / 999.0 * 0.1 // 0-10% bonus
        let inteligencia_base = self.clamp(avgIntelligence + hybridBonus, 0.1, 1.0)
        
        // Starting vocabulary based on intelligence
        let vocabulario_size = PersonalityModuleV2.BASE_VOCABULARY_SIZE + UInt64(inteligencia_base * 100.0)
        
        // === EMOTIONAL STATE INHERITANCE ===
        
        // Emotional traits start neutral but influenced by parents slightly
        let avgFelicidad = (p1.felicidad + p2.felicidad) / 2.0
        let felicidad = self.clamp(0.5 + (avgFelicidad - 0.5) * 0.3, 0.2, 0.8) // 30% influence
        
        let avgConfianza = (p1.confianza + p2.confianza) / 2.0
        let confianza = self.clamp(0.5 + (avgConfianza - 0.5) * 0.3, 0.2, 0.8)
        
        // Start with low stress
        let estres = 0.1 + (UFix64(randomSeed % 100) / 999.0) * 0.1 // 0.1-0.2
        
        // === FAMILY DATA ===
        
        let padres_ids = [
            0 as UInt64, // Would need actual creature IDs - placeholder
            0 as UInt64
        ]
        let generacion = self.max(p1.generacion, p2.generacion) + 1
        
        return <- create PersonalityTrait(
            temperamento: temperamento,
            agresividad: agresividad,
            curiosidad: curiosidad,
            energia_social: energia_social,
            creatividad: creatividad,
            empatia: empatia,
            inteligencia_base: inteligencia_base,
            vocabulario_size: vocabulario_size,
            complejidad_linguistica: 0.05, // Start young
            felicidad: felicidad,
            confianza: confianza,
            estres: estres,
            origen_nacimiento: "sexual",
            padres_ids: padres_ids,
            generacion: generacion
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p = parent as! &PersonalityTrait
        
        var randomSeed = seed
        
        // Mitosis: mostly identical with small mutations
        var temperamento = p.temperamento
        var agresividad = p.agresividad
        var curiosidad = p.curiosidad
        var energia_social = p.energia_social
        var creatividad = p.creatividad
        var empatia = p.empatia
        var inteligencia_base = p.inteligencia_base
        
        // Apply small mutations (lower chance than sexual reproduction)
        temperamento = self.applySmallMutation(temperamento, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        agresividad = self.applySmallMutation(agresividad, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        curiosidad = self.applySmallMutation(curiosidad, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        energia_social = self.applySmallMutation(energia_social, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        creatividad = self.applySmallMutation(creatividad, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        empatia = self.applySmallMutation(empatia, randomSeed)
        randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
        inteligencia_base = self.applySmallMutation(inteligencia_base, randomSeed)
        
        // Copy most attributes but reset some
        let vocabulario_size = PersonalityModuleV2.BASE_VOCABULARY_SIZE + UInt64(inteligencia_base * 50.0)
        
        // Emotional state resets to neutral for new individual
        let felicidad = 0.4 + (UFix64(randomSeed % 200) / 999.0) // 0.4-0.6
        let confianza = 0.4 + (UFix64(randomSeed % 200) / 999.0)
        let estres = UFix64(randomSeed % 100) / 999.0 * 0.2 // 0.0-0.2
        
        let padres_ids = [
            0 as UInt64 // Would need actual creature ID - placeholder
        ]
        
        return <- create PersonalityTrait(
            temperamento: temperamento,
            agresividad: agresividad,
            curiosidad: curiosidad,
            energia_social: energia_social,
            creatividad: creatividad,
            empatia: empatia,
            inteligencia_base: inteligencia_base,
            vocabulario_size: vocabulario_size,
            complejidad_linguistica: 0.05, // Start young
            felicidad: felicidad,
            confianza: confianza,
            estres: estres,
            origen_nacimiento: "mitosis",
            padres_ids: padres_ids,
            generacion: p.generacion + 1
        )
    }
    
    // === MUTATION HELPERS ===
    
    access(all) fun applyMutation(_ value: UFix64, _ seed: UInt64): UFix64 {
        // 5% chance of mutation in sexual reproduction
        if seed % 20 != 0 { return value }
        
        let mutationStrength = 0.05 // 5% maximum change
        let randomFactor = UFix64(seed % 100) / 100.0 // 0.0-1.0
        let isPositive = (seed % 2) == 0
        
        var newValue = value
        if isPositive {
            newValue = value + (randomFactor * mutationStrength)
        } else {
            let mutation = randomFactor * mutationStrength
            newValue = value > mutation ? value - mutation : 0.0
        }
        
        return self.clamp(newValue, 0.0, 1.0)
    }
    
    access(all) fun applySmallMutation(_ value: UFix64, _ seed: UInt64): UFix64 {
        // 2% chance of small mutation in mitosis
        if seed % 50 != 0 { return value }
        
        let mutationStrength = 0.02 // 2% maximum change
        let randomFactor = UFix64(seed % 100) / 100.0
        let isPositive = (seed % 2) == 0
        
        var newValue = value
        if isPositive {
            newValue = value + (randomFactor * mutationStrength)
        } else {
            let mutation = randomFactor * mutationStrength
            newValue = value > mutation ? value - mutation : 0.0
        }
        
        return self.clamp(newValue, 0.0, 1.0)
    }
    
    // === UTILITY FUNCTIONS ===
    
    access(all) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
        if value < minVal { return minVal }
        if value > maxVal { return maxVal }
        return value
    }
    
    access(all) fun min(_ a: UInt64, _ b: UInt64): UInt64 {
        return a < b ? a : b
    }
    
    access(all) fun max(_ a: UInt64, _ b: UInt64): UInt64 {
        return a > b ? a : b
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "personality"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Personality Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Advanced personality system with communication levels, emotional states, memory, and LLM prompt generation for interactive digital creatures"
    }
    
    init() {
        // === COMMUNICATION LEVELS ===
        self.COMMUNICATION_LEVELS = {
            "bebe": 0,      // Baby babble
            "toddler": 1,   // 1-2 words
            "child": 2,     // Simple sentences
            "teen": 3,      // Complex but emotional
            "adult": 4      // Full complexity
        }
        
        // === PERSONALITY TRAITS DESCRIPTIONS ===
        self.PERSONALITY_TRAITS = {
            "temperamento": "Extroversion vs Introversion",
            "agresividad": "Peaceful vs Aggressive nature",
            "curiosidad": "Interest in learning and exploring",
            "energia_social": "Desire for social interaction",
            "creatividad": "Artistic and imaginative thinking",
            "empatia": "Care and concern for others"
        }
        
        // === EMOTIONAL STATES ===
        self.EMOTIONAL_STATES = {
            "felicidad": "Overall happiness and joy",
            "confianza": "Self-confidence and assurance",
            "estres": "Anxiety and stress levels",
            "nostalgia": "Longing for past experiences",
            "excitacion": "Current excitement and energy",
            "melancolia": "Thoughtful sadness"
        }
        
        // === FAMILY ORIGINS ===
        self.FAMILY_ORIGINS = {
            "created": 0,   // Created by user/system
            "sexual": 1,    // Born from two parents
            "mitosis": 2    // Cloned from one parent
        }
        
        // === EXPERIENCE TYPES ===
        self.EXPERIENCE_TYPES = {
            "social_interaction": 1.0,
            "combat_won": 2.0,
            "combat_lost": 0.0,        // Negative handled in code logic
            "evolution_success": 1.5,
            "reproduction_success": 2.0,
            "user_abandoned": 0.0,     // Negative handled in code logic
            "user_returned": 1.5
        }
        
        // === VOCABULARY CONSTANTS ===
        self.BASE_VOCABULARY_SIZE = 10         // Starting words for babies
        self.MAX_VOCABULARY_SIZE = 2000        // Maximum vocabulary (genius level)
        self.MEMORY_LIMIT = 20                 // Maximum stored interactions
        self.RELATIONSHIP_DECAY_RATE = 0.001   // Daily relationship decay
        
        // === EVOLUTION RATES (daily growth) ===
        self.INTELLIGENCE_GROWTH_RATE = 0.001  // 0.1% daily intelligence growth
        self.VOCABULARY_GROWTH_RATE = 2.0      // 2 words per day (modified by intelligence)
        self.LINGUISTIC_GROWTH_RATE = 0.0005   // 0.05% daily linguistic complexity
        self.STRESS_DECAY_RATE = 0.02          // 2% daily stress reduction
    }
} 