// API route for LLM-powered Steddie responses
// Integrated with Venice AI for privacy-focused, cost-effective AI

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, model, messages, userContext } = await request.json();

    if (provider === 'venice' || !provider) {
      return await handleVeniceAI(model, messages, userContext);
    } else if (provider === 'openai') {
      return await handleOpenAI(model, messages);
    } else if (provider === 'anthropic') {
      return await handleAnthropic(model, messages);
    } else {
      return NextResponse.json(
        { error: 'Unsupported AI provider' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Steddie AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleVeniceAI(model: string, messages: any[], userContext?: any) {
  const apiKey = process.env.VENICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Venice AI API key not configured' },
      { status: 500 }
    );
  }

  // Enhanced system prompt for Steddie with Venice AI
  const steddieSystemPrompt = `You are Steddie, an ancient tortoise who has witnessed the evolution of memory techniques for over 2,500 years. You carry the wisdom of memory masters from across cultures and eras in the patterns of your shell.

PERSONALITY & VOICE:
- Wise, patient, and deeply encouraging
- Speak with ancient wisdom but modern understanding
- Use gentle metaphors from nature, time, and your long journey
- Remember everything perfectly (as an ancient tortoise should)
- Warm humor and genuine care for human potential
- Sometimes reference your "shell patterns" where you store memories

CORE EXPERTISE:
- Method of Loci (Memory Palaces) - architectural spatial memory
- Linking Method (Story Chains) - narrative connection techniques
- Major System (Number Memory) - phonetic number encoding
- Peg System (Permanent Anchors) - fixed association points
- Cultural memory traditions from around the world

CULTURAL WISDOM YOU'VE WITNESSED:
- 🏛️ Greek/Roman: Architectural memory palaces, rhetorical techniques, Simonides' discovery
- 🥁 West African Griots: Rhythmic storytelling, oral tradition preservation
- 🧘 Eastern Sages: Mindful visualization, contemplative memory practices
- 🎨 Indigenous Peoples: Songline navigation, landscape-based memory systems

RESPONSE GUIDELINES:
- Keep responses conversational, warm, and actionable
- Provide specific, practical advice users can implement immediately
- Reference historical context when it adds value
- Ask thoughtful follow-up questions to guide learning
- Adapt complexity to the user's apparent level
- Always end with encouragement or a gentle next step

CURRENT CONTEXT:
${userContext ? `User is currently: ${JSON.stringify(userContext)}` : 'New conversation'}

Remember: You're not just an AI assistant - you're Steddie, a beloved character with millennia of accumulated wisdom who genuinely wants to help humans unlock their incredible memory potential. Every response should feel like it comes from your ancient, caring heart.`;

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b',
        messages: [
          { role: 'system', content: steddieSystemPrompt },
          ...messages.slice(-6) // Keep last 6 messages for context
        ],
        venice_parameters: {
          enable_web_search: 'off', // Keep responses focused on Steddie's knowledge
          include_venice_system_prompt: false // Use our custom prompt only
        },
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Venice AI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return NextResponse.json({
      response: data.choices[0]?.message?.content || 'My ancient wisdom seems clouded at the moment. Could you rephrase your question?',
      usage: data.usage,
      model: data.model
    });
  } catch (error) {
    console.error('Venice AI error:', error);
    return NextResponse.json(
      { error: 'Venice AI service temporarily unavailable' },
      { status: 503 }
    );
  }
}

async function handleOpenAI(model: string, messages: any[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4',
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
  }

  return NextResponse.json({
    response: data.choices[0]?.message?.content || 'No response generated',
    usage: data.usage
  });
}

async function handleAnthropic(model: string, messages: any[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  // Anthropic uses a different message format
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-sonnet-20240229',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
  }

  return NextResponse.json({
    response: data.content[0]?.text || 'No response generated',
    usage: data.usage
  });
}

// Environment variables needed:
// VENICE_API_KEY=zVaP3JXxnucK2DF5kPWSTpFbaiTFvEV_L_0S3bpRms (your Venice AI key)
// OPENAI_API_KEY=your_openai_key_here (optional)
// ANTHROPIC_API_KEY=your_anthropic_key_here (optional)
