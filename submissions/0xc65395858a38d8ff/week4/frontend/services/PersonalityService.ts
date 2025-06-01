import * as fcl from '@onflow/fcl';

export interface PersonalityData {
  creatureID: string;
  creatureName: string;
  isAlive: string;
  age: string;
  displayName: string;
  personalityDescription: string;
  emotionalState: string;
  communicationLevel: string;
  intelligenceLevel: string;
  shouldSendSpontaneous: string;
  basePrompt: string;
  responsePrompt: string;
  spontaneousPrompt: string;
  rawTraitValue: string;
  error?: string;
}

export class PersonalityService {
  
  /**
   * Gets detailed personality data and prompts directly from the Cadence contract
   */
  static async getCreaturePersonalityPrompts(address: string, creatureID: number): Promise<PersonalityData | null> {
    try {
      console.log(`🧠 [PersonalityService] Getting personality prompts for creature ${creatureID} from contract...`);
      
      const GET_CREATURE_PERSONALITY_PROMPTS = `
        import "EvolvingCreatureNFT" from 0xf8d6e0586b0a20c7
        import "TraitModule" from 0xf8d6e0586b0a20c7
        import "PersonalityModuleV2" from 0xf8d6e0586b0a20c7

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
      `;
      
      const result = await fcl.query({
        cadence: GET_CREATURE_PERSONALITY_PROMPTS,
        args: (arg: any, t: any) => [
          arg(address, t.Address),
          arg(creatureID.toString(), t.UInt64)
        ]
      });
      
      console.log(`🧠 [PersonalityService] Raw result from contract:`, result);
      
      if (result.error) {
        console.error(`❌ [PersonalityService] Error from contract: ${result.error}`);
        return null;
      }
      
      console.log(`✅ [PersonalityService] Successfully got personality data for creature ${creatureID}`);
      console.log(`🎭 Personality: ${result.personalityDescription}`);
      console.log(`😊 Emotional State: ${result.emotionalState}`);
      console.log(`🗣️ Communication Level: ${result.communicationLevel}`);
      console.log(`📝 Base Prompt Length: ${result.basePrompt?.length || 0} chars`);
      
      return result as PersonalityData;
      
    } catch (error) {
      console.error(`❌ [PersonalityService] Failed to get personality prompts:`, error);
      return null;
    }
  }
  
  /**
   * Extracts just the prompt from the personality data
   */
  static getPromptFromPersonalityData(personalityData: PersonalityData, type: 'base' | 'response' | 'spontaneous' = 'spontaneous'): string {
    switch (type) {
      case 'base':
        return personalityData.basePrompt;
      case 'response':
        return personalityData.responsePrompt;
      case 'spontaneous':
      default:
        return personalityData.spontaneousPrompt;
    }
  }
  
  /**
   * Checks if a creature should send a spontaneous message based on contract data
   */
  static shouldCreatureSendMessage(personalityData: PersonalityData): boolean {
    return personalityData.shouldSendSpontaneous === 'true';
  }
  
  /**
   * Gets communication level from personality data
   */
  static getCommunicationLevel(personalityData: PersonalityData): string {
    return personalityData.communicationLevel || 'toddler';
  }
} 