require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const { fcl, t } = require('@onflow/fcl');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Initialize Flow
fcl.config()
  .put('accessNode.api', process.env.FLOW_ACCESS_NODE)
  .put('0xNonFungibleToken', process.env.NON_FUNGIBLE_TOKEN_ADDRESS)
  .put('0xMemoMint', process.env.MEMO_MINT_ADDRESS);

// Store conversation history
const conversations = new Map();

// Generate summary using OpenAI
async function generateSummary(messages) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes conversations into meaningful diary entries. Focus on the key points, emotions, and insights shared."
        },
        ...messages
      ],
    });

    return completion.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }
    
    const messages = conversations.get(sessionId);
    messages.push({ role: 'user', content: message });
    
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a thoughtful and empathetic AI journaling assistant. Help users reflect on their thoughts and experiences through meaningful conversation."
        },
        ...messages
      ],
    });
    
    const response = completion.data.choices[0].message;
    messages.push(response);
    
    res.json({ response: response.content });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const messages = conversations.get(sessionId) || [];
    
    const summary = await generateSummary(messages);
    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.post('/api/mint', async (req, res) => {
  try {
    const { summary, address } = req.body;
    
    const transaction = await fcl.send([
      fcl.transaction`
        import MemoMint from 0xMemoMint
        import NonFungibleToken from 0xNonFungibleToken
        
        transaction(summary: String) {
          prepare(signer: AuthAccount) {
            let collection = signer.borrow<&MemoMint.Collection>(from: /storage/MemoMintCollection)
              ?? panic("Collection not found")
            
            MemoMint.mintNFT(summary: summary, recipient: collection)
          }
        }
      `,
      fcl.args([fcl.arg(summary, t.String)]),
      fcl.proposer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.payer(fcl.authz),
    ]);
    
    const result = await fcl.tx(transaction).onceSealed();
    res.json({ transactionId: result.id });
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 