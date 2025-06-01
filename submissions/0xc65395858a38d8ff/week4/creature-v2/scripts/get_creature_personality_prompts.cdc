// Get Creature Personality Prompts Script
import "EvolvingCreatureNFT"
import "TraitModule"
import "PersonalityModuleV2"

access(all) fun main(address: Address, creatureID: UInt64): {String: String} {
    let account = getAccount(address)
    let collectionCap = account.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
    
    if !collectionCap.check() {
        return {"error": "Collection not found or not accessible"}
    }
    
    let collection = collectionCap.borrow()!
    
    if let creature = collection.borrowEvolvingCreatureNFT(id: creatureID) {
        if !creature.estaViva {
            return {"error": "Creature is dead"}
        }
        
        // Check if creature has personality module
        if !creature.traits.containsKey("personality") {
            return {"error": "Creature does not have personality module. Try evolving it first."}
        }
        
        // Get personality trait reference
        if let personalityTrait = creature.traits["personality"] as &{TraitModule.Trait}? {
            // Cast to PersonalityModuleV2 trait to access specific methods
            if let personalityV2Trait = personalityTrait as! &PersonalityModuleV2.PersonalityTrait? {
                
                // Generate different types of prompts
                let basePrompt = personalityV2Trait.generateChatPrompt(
                    context: "General interaction with user", 
                    userMessage: nil
                )
                
                let responsePrompt = personalityV2Trait.generateChatPrompt(
                    context: "User is asking about the creature's feelings", 
                    userMessage: "How are you feeling today?"
                )
                
                let spontaneousPrompt = personalityV2Trait.generateChatPrompt(
                    context: "Creature wants to send a spontaneous message", 
                    userMessage: nil
                )
                
                // Get personality details
                let personalityDesc = personalityV2Trait.getDetailedPersonalityDescription()
                let emotionalState = personalityV2Trait.getDetailedEmotionalState()
                let displayName = personalityV2Trait.getDisplayName()
                let communicationLevel = personalityV2Trait.getNivelComunicacion()
                let shouldSpontaneous = personalityV2Trait.shouldSendSpontaneousMessage()
                let intelligenceDesc = personalityV2Trait.getIntelligenceDescription()
                
                return {
                    "creatureID": creatureID.toString(),
                    "creatureName": creature.name,
                    "isAlive": creature.estaViva ? "true" : "false",
                    "age": creature.edadDiasCompletos.toString(),
                    "displayName": displayName,
                    "personalityDescription": personalityDesc,
                    "emotionalState": emotionalState,
                    "communicationLevel": communicationLevel,
                    "intelligenceLevel": intelligenceDesc,
                    "shouldSendSpontaneous": shouldSpontaneous ? "true" : "false",
                    "basePrompt": basePrompt,
                    "responsePrompt": responsePrompt,
                    "spontaneousPrompt": spontaneousPrompt,
                    "rawTraitValue": personalityTrait.getValue()
                }
            } else {
                return {"error": "Could not cast to PersonalityModuleV2 trait"}
            }
        } else {
            return {"error": "Could not access personality trait"}
        }
    } else {
        return {"error": "Creature not found"}
    }
} 