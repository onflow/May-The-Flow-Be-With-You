const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct"; // Llama model - more stable via Cerebras
const DEFAULT_SITE_URL = "https://a0x.ai";
const DEFAULT_SITE_NAME = "A0X";

// Available models - matching backend exactly
export const AVAILABLE_MODELS = {
  QWEN_32B: "qwen/qwen3-32b", // Primary model via Cerebras
  LLAMA_8B: "meta-llama/llama-3.1-8b-instruct", // Fallback model - more stable
} as const;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  providerPreference?: { only: string[] };
}

export class OpenRouterService {
  private apiKey: string;
  private siteUrl: string;
  private siteName: string;

  constructor(apiKey: string, siteUrl?: string, siteName?: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required for OpenRouterService.");
    }
    this.apiKey = apiKey;
    this.siteUrl = siteUrl || DEFAULT_SITE_URL;
    this.siteName = siteName || DEFAULT_SITE_NAME;
    
    // Debug: Log API key info (partial for security)
    console.log(`[OpenRouterService] API key configured: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`);
  }

  /**
   * Generates a chat completion using the OpenRouter API.
   * Defaults to using the Qwen model via Cerebras.
   * @param userContent The content of the user's message.
   * @param systemContent Optional system message to guide the model.
   * @param model Optional model override. Defaults to Qwen.
   * @param providerPreference Optional provider preference. Defaults to Cerebras only.
   * @returns The model's response content.
   */
  async chat(
    userContent: string,
    systemContent: string | null = null,
    model: string = DEFAULT_MODEL,
    providerPreference: { only: string[] } = { only: ["Cerebras"] }
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemContent && systemContent.trim() !== "") {
      messages.push({
        role: "system",
        content: systemContent,
      });
    }
    
    messages.push({
      role: "user",
      content: userContent,
    });

    console.log(
      `[OpenRouterService] Requesting completion for model: ${model} with provider: ${JSON.stringify(
        providerPreference
      )}`
    );

    // Debug: Log request details (without full API key)
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "HTTP-Referer": this.siteUrl,
      "X-Title": this.siteName,
      "Content-Type": "application/json",
    };
    
    const requestBody = {
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096,
      provider: providerPreference,
    };
    
    console.log(`[OpenRouterService] Request headers (auth hidden):`, {
      ...headers,
      "Authorization": `Bearer ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`
    });
    console.log(`[OpenRouterService] Request body:`, requestBody);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          `[OpenRouterService] API error: ${response.status} - ${response.statusText}`,
          errorData
        );
        throw new Error(
          `OpenRouter API request failed with status ${response.status}: ${errorData}`
        );
      }

      const data: OpenRouterResponse = await response.json();

      if (
        !data.choices ||
        data.choices.length === 0 ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        console.error("[OpenRouterService] Invalid response structure from API:", data);
        throw new Error("OpenRouter returned an invalid or empty response structure.");
      }

      // Log usage stats if available
      if (data.usage) {
        console.log(
          `[OpenRouterService] Token usage: ${data.usage.prompt_tokens} prompt + ${data.usage.completion_tokens} completion = ${data.usage.total_tokens} total`
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("[OpenRouterService] Error during chat completion:", error);
      throw error;
    }
  }

  /**
   * Convenience method for creature analysis using a specialized system prompt.
   * @param creatureData The creature data to analyze.
   * @param analysisType The type of analysis to perform.
   * @returns The AI's analysis.
   */
  async analyzeCreature(
    creatureData: any, 
    analysisType: "personality" | "health" | "evolution" | "breeding" = "personality"
  ): Promise<string> {
    const systemPrompts = {
      personality: `You are an expert xenobiologist studying unique life forms in the Primordia Genesis Protocol. 
      Analyze the creature's traits and behavior patterns to provide insights into their personality and character.
      Be creative and scientific in your analysis.`,
      
      health: `You are a cosmic veterinarian specializing in Genesis Protocol life forms.
      Analyze the creature's health metrics, energy levels, and physical condition.
      Provide recommendations for optimal care.`,
      
      evolution: `You are an evolutionary biologist studying rapid adaptation in Primordia.
      Analyze the creature's evolutionary potential and development patterns.
      Suggest optimal evolution strategies.`,
      
      breeding: `You are a genetic specialist for the Genesis Shapers.
      Analyze the creature's reproductive traits and compatibility factors.
      Provide breeding recommendations for optimal offspring.`
    };

    const userContent = `Analyze this Primordia life form:
    
ID: ${creatureData.id}
Age: ${creatureData.edadDiasCompletos} days
Anima Essence: ${creatureData.puntosEvolucion}
Status: ${creatureData.estaViva ? 'Alive' : 'Deceased'}

Visual Traits: ${JSON.stringify(creatureData.visual, null, 2)}
Advanced Traits: ${JSON.stringify(creatureData.advanced, null, 2)}

Please provide a detailed ${analysisType} analysis.`;

    return this.chat(
      userContent,
      systemPrompts[analysisType],
      AVAILABLE_MODELS.QWEN_32B // Use the correct Qwen model
    );
  }

  /**
   * Generate a creature name based on its traits.
   * @param creatureData The creature data.
   * @returns A generated name.
   */
  async generateCreatureName(creatureData: any): Promise<string> {
    const systemMessage = `You are a cosmic taxonomist for the Genesis Shapers. 
    Generate a unique, memorable name for life forms based on their traits and characteristics.
    Names should feel alien yet pronounceable, reflecting the creature's essence.
    Respond with ONLY the name, no explanation.`;

    const userContent = `Generate a name for this life form:
    Form: ${creatureData.visual?.formaPrincipal || 'Unknown'}
    Size: ${creatureData.visual?.tamanoBase || 1}
    Health: ${creatureData.advanced?.nivelSalud || 1}
    Energy: ${creatureData.advanced?.nivelEnergia || 1}
    Age: ${creatureData.edadDiasCompletos} days
    Anima: ${creatureData.puntosEvolucion}`;

    return this.chat(
      userContent,
      systemMessage,
      AVAILABLE_MODELS.QWEN_32B
    );
  }

  /**
   * Get breeding compatibility advice for two creatures.
   * @param creature1 First creature data.
   * @param creature2 Second creature data.
   * @returns Compatibility analysis.
   */
  async analyzeBreedingCompatibility(creature1: any, creature2: any): Promise<string> {
    const systemMessage = `You are a Genesis Protocol breeding specialist.
    Analyze genetic compatibility between two life forms and predict offspring characteristics.
    Consider traits, health, energy, and genetic diversity.`;

    const userContent = `Analyze breeding compatibility:

CREATURE A:
ID: ${creature1.id}
Age: ${creature1.edadDiasCompletos} days
Health: ${creature1.advanced?.nivelSalud || 1}
Energy: ${creature1.advanced?.nivelEnergia || 1}
Form: ${creature1.visual?.formaPrincipal || 'Unknown'}

CREATURE B:
ID: ${creature2.id}
Age: ${creature2.edadDiasCompletos} days  
Health: ${creature2.advanced?.nivelSalud || 1}
Energy: ${creature2.advanced?.nivelEnergia || 1}
Form: ${creature2.visual?.formaPrincipal || 'Unknown'}

Provide compatibility assessment and offspring predictions.`;

    return this.chat(
      userContent,
      systemMessage,
      AVAILABLE_MODELS.QWEN_32B
    );
  }
}

// Default instance factory
export const createOpenRouterService = (apiKey: string): OpenRouterService => {
  return new OpenRouterService(apiKey);
};

// Export types for use in other components
export type { ChatOptions, ChatMessage }; 