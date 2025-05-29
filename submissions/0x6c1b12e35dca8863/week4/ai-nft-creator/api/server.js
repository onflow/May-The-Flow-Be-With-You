// server.js - Backend API for AI NFT Creator

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const LLMClient = require('../ai-services/llm-client');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web')));

// Initialize AI client
const llmClient = new LLMClient();

// Routes
app.post('/api/generate-concept', async (req, res) => {
    try {
        const { prompt, style, model, rarity } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        console.log(`Generating concept for: "${prompt}" with model: ${model}`);
        
        // Generate NFT concept using AI
        const concept = await llmClient.generateNFTConcept(prompt, style);
        
        if (!concept) {
            throw new Error('Failed to generate concept');
        }
        
        // Generate image using DALL-E 3
        const imageUrl = await llmClient.generateImage(
            `${concept.description} in ${style} style, high quality digital art, ${concept.visualElements?.join(', ') || ''}`
        );
        
        // Enhance description using Claude
        const enhancedDescription = await llmClient.enhanceArtDescription(
            concept.description,
            style
        );
        
        // Generate attributes
        const attributes = await llmClient.generateAttributes(concept, rarity);
        
        const finalConcept = {
            ...concept,
            description: enhancedDescription,
            attributes,
            style,
            rarity
        };
        
        res.json({
            concept: finalConcept,
            imageUrl,
            model,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error generating concept:', error);
        res.status(500).json({ 
            error: 'Failed to generate AI concept',
            details: error.message 
        });
    }
});

app.get('/api/recent-nfts', async (req, res) => {
    try {
        // In a real implementation, this would query the blockchain
        // For now, return mock data
        const mockNFTs = [
            {
                id: 1,
                name: "Cosmic Dreams",
                description: "A surreal journey through digital space with flowing geometric patterns",
                imageURL: "https://picsum.photos/400/400?random=1",
                aiModel: "GPT-4 + DALL-E 3",
                creator: "0x123...abc"
            },
            {
                id: 2,
                name: "Digital Wilderness",
                description: "Nature meets technology in this cyberpunk landscape",
                imageURL: "https://picsum.photos/400/400?random=2",
                aiModel: "Claude + Stable Diffusion",
                creator: "0x456...def"
            },
            {
                id: 3,
                name: "Abstract Emotions",
                description: "Colors and shapes expressing the complexity of human feelings",
                imageURL: "https://picsum.photos/400/400?random=3",
                aiModel: "Custom Fine-tuned",
                creator: "0x789...ghi"
            }
        ];
        
        res.json(mockNFTs);
    } catch (error) {
        console.error('Error fetching recent NFTs:', error);
        res.status(500).json({ error: 'Failed to fetch recent NFTs' });
    }
});

app.get('/api/ai-stats', async (req, res) => {
    try {
        // Mock AI statistics - in real implementation, query from blockchain
        const stats = {
            totalNFTs: 1247,
            activeModels: 5,
            averageRating: 4.6,
            topModel: "GPT-4 + DALL-E 3",
            dailyCreations: 45
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching AI stats:', error);
        res.status(500).json({ error: 'Failed to fetch AI statistics' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.html'));
});

app.listen(port, () => {
    console.log(`AI NFT Creator API running on port ${port}`);
});

module.exports = app;