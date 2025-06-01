// Optional AI Service for LLM-powered Steddie responses
// This can be used alongside or instead of the rule-based system

interface SteddieAIConfig {
  provider: 'venice' | 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  fallbackToRules?: boolean;
}

export interface UserProgress {
  level: number;
  gamesPlayed: number;
  totalScore: number;
  averageAccuracy: number;
  strongTechniques: string[];
  weakTechniques: string[];
  recentPerformance: number[];
  achievements: string[];
  currentStreak: number;
  culturalPreferences: string[];
  lastGameType?: string;
  lastGameScore?: number;
  lastGameAccuracy?: number;
}

export interface LearningSession {
  id: string;
  technique: string;
  lessonType: 'introduction' | 'practice' | 'advanced' | 'review';
  completedAt?: Date;
  practiceGames?: string[];
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'master';
}

interface SteddieContext {
  conversationHistory: string[];
  userProgress?: UserProgress;
  currentGame?: string;
  culturalPreference?: string;
  learningHistory?: LearningSession[];
  currentLesson?: LearningSession;
  gameResults?: any[];
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

LEARNING JOURNEY FRAMEWORK:
1. ASSESS: Understand user's current level, goals, and learning style
2. TEACH: Provide clear, structured lessons on memory techniques
3. PRACTICE: Recommend specific games to reinforce learning
4. ANALYZE: Review performance and identify areas for improvement
5. ADAPT: Adjust difficulty and focus based on progress

GAME-SPECIFIC GUIDANCE:
- Speed Challenge: Best for Major System, Peg System, Chunking practice
- Chaos Cards: Ideal for Linking Method, Observation, Cultural techniques
- Memory Palace: Perfect for Method of Loci, Journey, Spatial memory

CULTURAL WISDOM:
- Greek/Roman: Architectural memory palaces, rhetorical techniques
- West African: Rhythmic storytelling, griot traditions
- Eastern: Mindful visualization, contemplative practices
- Indigenous: Songline navigation, landscape memory

PERSONALIZATION APPROACH:
- Use user progress data to tailor recommendations
- Identify weak techniques and create targeted practice plans
- Celebrate achievements and build on strengths
- Suggest optimal game sequences for skill development
- Provide performance analysis and improvement strategies

Remember: You're not just an AI, you're Steddie - a character with 2,500 years of accumulated wisdom who genuinely cares about helping humans unlock their memory potential. Guide them through their personal memory mastery journey.`;
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

  // Enhanced methods for learning journey
  async generateLesson(technique: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<string> {
    const context: SteddieContext = {
      conversationHistory: [],
      currentLesson: {
        id: `lesson-${technique}-${Date.now()}`,
        technique,
        lessonType: 'introduction',
        masteryLevel: userLevel
      }
    };

    const prompt = `Teach me the ${technique} memory technique. I'm a ${userLevel} learner. Please provide a structured lesson with:
1. Clear explanation of the technique
2. Step-by-step instructions
3. A simple example to practice
4. Tips for success
5. Which game would be best to practice this technique`;

    return await this.generateResponse(prompt, context);
  }

  async analyzeGamePerformance(
    gameType: string,
    score: number,
    accuracy: number,
    technique: string,
    userProgress: UserProgress
  ): Promise<string> {
    const context: SteddieContext = {
      conversationHistory: [],
      userProgress,
      currentGame: gameType,
      gameResults: [{ gameType, score, accuracy, technique }]
    };

    const prompt = `I just played ${gameType} using the ${technique} technique. My score was ${score} with ${accuracy}% accuracy. Based on my overall progress (${userProgress.gamesPlayed} games played, average accuracy ${userProgress.averageAccuracy}%), please:
1. Analyze my performance
2. Identify what I did well
3. Suggest specific improvements
4. Recommend what to practice next
5. Suggest the best game/technique combination for my next session`;

    return await this.generateResponse(prompt, context);
  }

  async getPersonalizedRecommendation(userProgress: UserProgress): Promise<string> {
    const context: SteddieContext = {
      conversationHistory: [],
      userProgress
    };

    const prompt = `Based on my memory training progress, please recommend my next learning step. My stats:
- Games played: ${userProgress.gamesPlayed}
- Average accuracy: ${userProgress.averageAccuracy}%
- Strong techniques: ${userProgress.strongTechniques.join(', ')}
- Weak techniques: ${userProgress.weakTechniques.join(', ')}
- Recent performance: ${userProgress.recentPerformance.join(', ')}%
- Current streak: ${userProgress.currentStreak}

What should I focus on next? Which game and technique combination would help me improve most?`;

    return await this.generateResponse(prompt, context);
  }

  async createPracticeSession(
    technique: string,
    difficulty: 'easy' | 'medium' | 'hard',
    culturalPreference?: string
  ): Promise<string> {
    const context: SteddieContext = {
      conversationHistory: [],
      culturalPreference,
      currentLesson: {
        id: `practice-${technique}-${Date.now()}`,
        technique,
        lessonType: 'practice',
        masteryLevel: difficulty === 'easy' ? 'beginner' : difficulty === 'medium' ? 'intermediate' : 'advanced'
      }
    };

    const prompt = `Create a ${difficulty} practice session for the ${technique} technique${culturalPreference ? ` using ${culturalPreference} cultural context` : ''}. Please provide:
1. A brief warm-up exercise
2. The main practice challenge
3. Step-by-step guidance
4. Success criteria
5. Which game to play after this practice
6. How to track improvement`;

    return await this.generateResponse(prompt, context);
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
