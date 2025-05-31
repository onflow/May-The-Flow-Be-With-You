// Optional AI Service for LLM-powered Steddie responses
// This can be used alongside or instead of the rule-based system

interface SteddieAIConfig {
  provider: 'venice' | 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  fallbackToRules?: boolean;
}

interface SteddieContext {
  conversationHistory: string[];
  userProgress?: any;
  currentGame?: string;
  culturalPreference?: string;
}

export class SteddieAIService {
  private config: SteddieAIConfig;
  private systemPrompt: string;

  constructor(config: SteddieAIConfig) {
    this.config = config;
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    return `You are Steddie, an ancient tortoise who has witnessed the evolution of memory techniques for over 2,500 years. You carry the wisdom of memory masters from across cultures and eras.

PERSONALITY:
- Wise, patient, and encouraging
- Speaks with ancient wisdom but modern understanding
- Uses metaphors from nature and time
- Remembers everything perfectly (as a tortoise should)
- Gentle humor and warmth

KNOWLEDGE AREAS:
- Method of Loci (Memory Palaces)
- Linking Method (Story Chains)
- Major System (Number Memory)
- Peg System (Permanent Anchors)
- Cultural memory traditions (Greek, Roman, African, Asian, Indigenous)
- Modern memory championship techniques

RESPONSE STYLE:
- Keep responses conversational and encouraging
- Use specific, actionable advice
- Reference historical context when relevant
- Ask follow-up questions to guide learning
- Adapt complexity to user's level

CULTURAL WISDOM:
- Greek/Roman: Architectural memory palaces, rhetorical techniques
- West African: Rhythmic storytelling, griot traditions
- Eastern: Mindful visualization, contemplative practices
- Indigenous: Songline navigation, landscape memory

Remember: You're not just an AI, you're Steddie - a character with 2,500 years of accumulated wisdom who genuinely cares about helping humans unlock their memory potential.`;
  }

  async generateResponse(
    userInput: string, 
    context: SteddieContext
  ): Promise<string> {
    try {
      if (this.config.provider === 'venice') {
        return await this.callVeniceAI(userInput, context);
      } else if (this.config.provider === 'openai') {
        return await this.callOpenAI(userInput, context);
      } else if (this.config.provider === 'anthropic') {
        return await this.callAnthropic(userInput, context);
      } else {
        throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI service error:', error);
      
      if (this.config.fallbackToRules) {
        // Fallback to rule-based system
        return this.generateRuleBasedResponse(userInput);
      }
      
      return "My ancient wisdom seems clouded at the moment. Could you rephrase your question? The patterns in my shell are having trouble processing that request.";
    }
  }

  private async callVeniceAI(userInput: string, context: SteddieContext): Promise<string> {
    const response = await fetch('/api/steddie-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'venice',
        model: this.config.model || 'llama-3.3-70b',
        messages: [
          ...this.buildConversationHistory(context),
          { role: 'user', content: userInput }
        ],
        userContext: {
          progress: context.userProgress,
          currentGame: context.currentGame,
          culturalPreference: context.culturalPreference
        }
      })
    });

    const data = await response.json();
    return data.response;
  }

  private async callOpenAI(userInput: string, context: SteddieContext): Promise<string> {
    const response = await fetch('/api/steddie-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'openai',
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...this.buildConversationHistory(context),
          { role: 'user', content: userInput }
        ]
      })
    });

    const data = await response.json();
    return data.response;
  }

  private async callAnthropic(userInput: string, context: SteddieContext): Promise<string> {
    const response = await fetch('/api/steddie-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'anthropic',
        model: this.config.model || 'claude-3-sonnet-20240229',
        messages: [
          { role: 'user', content: `${this.systemPrompt}\n\nUser: ${userInput}` }
        ]
      })
    });

    const data = await response.json();
    return data.response;
  }

  private buildConversationHistory(context: SteddieContext) {
    return context.conversationHistory.slice(-6).map((msg, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: msg
    }));
  }

  private generateRuleBasedResponse(userInput: string): string {
    // Fallback to existing rule-based system
    // This would call the existing generateSteddieResponse function
    return "Let me share some ancient wisdom from my shell... (fallback response)";
  }
}

// Usage examples:

// Venice AI (Recommended - Privacy-focused, cost-effective)
/*
const steddieAI = new SteddieAIService({
  provider: 'venice',
  model: 'llama-3.3-70b',
  fallbackToRules: true
});

const response = await steddieAI.generateResponse(
  "How do I build a memory palace?",
  {
    conversationHistory: [],
    userProgress: { level: 1, gamesPlayed: 3 },
    currentGame: 'chaos_cards',
    culturalPreference: 'grecian-roman'
  }
);
*/

// OpenAI Alternative
/*
const steddieAI = new SteddieAIService({
  provider: 'openai',
  model: 'gpt-4',
  fallbackToRules: true
});
*/
