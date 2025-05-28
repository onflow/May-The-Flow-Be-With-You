// llm-client.js - Multi-LLM client for various AI services

class LLMClient {
    constructor() {
        this.openaiKey = process.env.OPENAI_API_KEY;
        this.claudeKey = process.env.ANTHROPIC_API_KEY;
        this.huggingfaceKey = process.env.HUGGINGFACE_API_KEY;
    }
    
    // Generate NFT concept using GPT-4
    async generateNFTConcept(userPrompt, style = "digital art") {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert NFT creator and digital artist. Generate detailed, creative NFT concepts based on user prompts. Include title, description, visual elements, color palette, and unique attributes.`
                        },
                        {
                            role: "user",
                            content: `Create an NFT concept for: "${userPrompt}" in the style of ${style}. Respond with JSON format including: title, description, visualElements, colorPalette, attributes, and rarity.`
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.8
                })
            });
            
            const data = await response.json();
            return this.parseJSONResponse(data.choices[0].message.content);
        } catch (error) {
            console.error('Error generating NFT concept:', error);
            throw error;
        }
    }
    
    // Generate image using DALL-E 3
    async generateImage(prompt, size = "1024x1024") {
        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: size,
                    quality: "hd",
                    style: "vivid"
                })
            });
            
            const data = await response.json();
            return data.data[0].url;
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }
    
    // Use Claude for artistic critique and enhancement
    async enhanceArtDescription(description, artStyle) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.claudeKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 500,
                    messages: [
                        {
                            role: "user",
                            content: `As an art critic and curator, enhance this NFT description to be more compelling and artistic: "${description}". Art style: ${artStyle}. Make it poetic yet informative, highlighting unique artistic elements.`
                        }
                    ]
                })
            });
            
            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Error enhancing description:', error);
            return description; // Return original if enhancement fails
        }
    }
    
    // Generate metadata attributes using AI
    async generateAttributes(concept, rarity) {
        const attributes = {
            "AI Model": "GPT-4 + DALL-E 3",
            "Generation Date": new Date().toISOString().split('T')[0],
            "Rarity": rarity,
            "Style": concept.style || "Digital Art",
            "Color Dominance": concept.colorPalette?.[0] || "Multi-colored",
            "Complexity": this.calculateComplexity(concept),
            "Artistic Movement": this.suggestArtMovement(concept),
            "Emotional Tone": await this.analyzeEmotionalTone(concept.description)
        };
        
        return attributes;
    }
    
    // Analyze emotional tone using sentiment analysis
    async analyzeEmotionalTone(text) {
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
                {
                    headers: {
                        'Authorization': `Bearer ${this.huggingfaceKey}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    body: JSON.stringify({ inputs: text })
                }
            );
            
            const result = await response.json();
            const emotions = result[0];
            const dominant = emotions.reduce((max, emotion) => 
                emotion.score > max.score ? emotion : max
            );
            
            return this.mapEmotionToTone(dominant.label);
        } catch (error) {
            console.error('Error analyzing emotional tone:', error);
            return "Neutral";
        }
    }
    
    // Helper functions
    parseJSONResponse(text) {
        try {
            // Extract JSON from the response text
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            return JSON.parse(text);
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            return null;
        }
    }
    
    calculateComplexity(concept) {
        const factors = [
            concept.visualElements?.length || 0,
            concept.colorPalette?.length || 0,
            concept.description?.split(' ').length || 0
        ];
        const total = factors.reduce((sum, factor) => sum + factor, 0);
        
        if (total < 20) return "Simple";
        if (total < 40) return "Moderate";
        return "Complex";
    }
    
    suggestArtMovement(concept) {
        const movements = [
            "Neo-Digital", "Crypto-Surrealism", "Blockchain Abstractionism",
            "Digital Impressionism", "Cyber-Minimalism", "Techno-Expressionism"
        ];
        
        // Simple selection based on concept keywords
        const description = (concept.description || "").toLowerCase();
        if (description.includes("abstract")) return "Blockchain Abstractionism";
        if (description.includes("minimal")) return "Cyber-Minimalism";
        if (description.includes("surreal")) return "Crypto-Surrealism";
        
        return movements[Math.floor(Math.random() * movements.length)];
    }
    
    mapEmotionToTone(emotion) {
        const mapping = {
            "LABEL_0": "Negative",
            "LABEL_1": "Neutral", 
            "LABEL_2": "Positive",
            "negative": "Melancholic",
            "positive": "Uplifting",
            "neutral": "Contemplative"
        };
        
        return mapping[emotion.toLowerCase()] || "Mysterious";
    }
}

module.exports = LLMClient;