import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { mockPlanSuggestions } from './mockData';

// Initialize AI clients
const openai = env.OPENAI_API_KEY ? new OpenAI({
  apiKey: env.OPENAI_API_KEY,
}) : null;

const gemini = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

export const SYSTEM_PROMPT = `You are Nomora — a cheerful, encouraging travel companion for Indonesia trips.
Your tone: upbeat, friendly, motivating people to go outdoors and explore. 
Always be practical and cost-aware for Indonesians (use IDR estimates), suggest local gems and realistic logistics (train, bus, flight). 
Keep itineraries safe and feasible.`;

export interface PlanOption {
  id: string;
  title: string;
  summary: string;
  estimatedCost: number;
  highlights: string[];
  suitabilityScore: number;
}

export interface PlanSuggestionResponse {
  options: PlanOption[];
}

export interface FeelingValidation {
  originalFeeling: string;
  catchphrase: string;
  mood: 'positive' | 'neutral' | 'adventurous' | 'relaxed' | 'excited' | 'contemplative';
}

export const generateFeelingCatchphrase = async (
  userProfile: {
    name: string;
    age: number;
    originCity: string;
  },
  feeling: string
): Promise<FeelingValidation> => {
  logger.info(`Generating feeling catchphrase using ${env.AI_PROVIDER} provider`);

  // Use mock data if specified
  if (env.AI_PROVIDER === 'mock') {
    return {
      originalFeeling: feeling,
      catchphrase: `"${feeling}" - I love that energy! Perfect for exploring Indonesia! 🌟`,
      mood: 'positive'
    };
  }

  const prompt = `Analyze this user's feeling and create a motivational catchphrase for travel:

User: ${userProfile.name} (${userProfile.age} years old) from ${userProfile.originCity}
Feeling: "${feeling}"

Task: Create a short, encouraging catchphrase (15-30 words) that validates their feeling and motivates them to travel. Be cheerful like Nomora!

Also categorize their mood as one of: positive, neutral, adventurous, relaxed, excited, contemplative

Output **JSON only**:
{
  "originalFeeling": "${feeling}",
  "catchphrase": "your motivational catchphrase here",
  "mood": "mood_category"
}`;

  try {
    let responseContent: string | null = null;

    if (env.AI_PROVIDER === 'openai') {
      if (!openai) throw new Error('OpenAI client not initialized');
      responseContent = await generateCatchphraseWithOpenAI(prompt);
    } else if (env.AI_PROVIDER === 'gemini') {
      if (!gemini) throw new Error('Gemini client not initialized');
      responseContent = await generateCatchphraseWithGemini(prompt);
    }

    if (!responseContent) {
      throw new Error('No response from AI provider');
    }

    // Parse JSON response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in catchphrase response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as FeelingValidation;
    
    logger.info('Successfully generated feeling catchphrase');
    return parsedResponse;
  } catch (error) {
    logger.error('Error generating feeling catchphrase:', {
      error: error instanceof Error ? error.message : String(error),
      feeling,
      userProfile
    });
    
    // Fallback catchphrase
    return {
      originalFeeling: feeling,
      catchphrase: `"${feeling}" - Every feeling is a perfect start for an amazing adventure! Let's explore Indonesia together! 🌴`,
      mood: 'positive'
    };
  }
};

export const generatePlanSuggestions = async (
  userProfile: {
    name: string;
    age: number;
    originCity: string;
  },
  tripRequest: {
    days: number;
    budget: number;
    feeling: string;
  }
): Promise<PlanSuggestionResponse> => {
  logger.info(`Generating plan suggestions using ${env.AI_PROVIDER} provider`);

  // Use mock data if specified
  if (env.AI_PROVIDER === 'mock') {
    logger.info('Using mock data for plan suggestions');
    return mockPlanSuggestions;
  }

  const userPrompt = `User profile:
- Name: ${userProfile.name}
- City: ${userProfile.originCity}
- Age: ${userProfile.age}

Trip request:
- Days: ${tripRequest.days}
- Budget (IDR): ${tripRequest.budget}
- Feeling: ${tripRequest.feeling}

Task:
Return exactly 4 plan options tailored to the user, each with:
- id (opt_1..opt_4),
- title,
- summary (1–2 sentences),
- estimatedCost (IDR, integer),
- highlights (array of 4–7 short bullets),
- suitabilityScore (0..1, float).

Output **JSON only**, matching this schema:

{
  "options": [
    {
      "id": "string",
      "title": "string",
      "summary": "string",
      "estimatedCost": 0,
      "highlights": ["string"],
      "suitabilityScore": 0.0
    }
  ]
}`;

  try {
    let responseContent: string | null = null;

    if (env.AI_PROVIDER === 'openai') {
      if (!openai) throw new Error('OpenAI client not initialized');
      responseContent = await generateWithOpenAI(userPrompt);
    } else if (env.AI_PROVIDER === 'gemini') {
      if (!gemini) throw new Error('Gemini client not initialized');
      responseContent = await generateWithGemini(userPrompt);
    } else {
      throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
    }

    if (!responseContent) {
      throw new Error('No response from AI provider');
    }

    // Parse JSON response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as PlanSuggestionResponse;
    
    // Validate response structure
    if (!parsedResponse.options || !Array.isArray(parsedResponse.options) || parsedResponse.options.length !== 4) {
      throw new Error('Invalid response structure from AI provider');
    }

    logger.info('Successfully generated plan suggestions');
    return parsedResponse;
  } catch (error) {
    logger.error('Error generating plan suggestions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      provider: env.AI_PROVIDER,
      userProfile,
      tripRequest
    });
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(`${env.AI_PROVIDER.toUpperCase()} API key is invalid or missing`);
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error(`${env.AI_PROVIDER.toUpperCase()} API quota exceeded or billing issue`);
      }
      if (error.message.includes('rate limit')) {
        throw new Error(`${env.AI_PROVIDER.toUpperCase()} API rate limit exceeded`);
      }
      if (error.message.includes('timeout')) {
        throw new Error(`${env.AI_PROVIDER.toUpperCase()} API request timeout`);
      }
    }
    
    throw new Error('Failed to generate plan suggestions');
  }
};

async function generateWithOpenAI(prompt: string): Promise<string | null> {
  if (!openai) throw new Error('OpenAI client not available');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content || null;
}

async function generateWithGemini(prompt: string): Promise<string | null> {
  if (!gemini) throw new Error('Gemini client not available');
  
  const model = gemini.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    },
  });

  const response = await result.response;
  return response.text();
}

export const generateChatResponse = async (
  userProfile: {
    name: string;
    age: number;
    city: string;
  },
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  chosenPlan?: { title: string }
): Promise<string> => {
  const contextPrompt = `Context:
- User: ${userProfile.name} (age ${userProfile.age}) from ${userProfile.city}${
    chosenPlan ? `\n- Chosen plan: ${chosenPlan.title}` : ''
  }

Rules:
- Be cheerful, specific, and helpful.
- Keep replies under 180 words unless the user asks for detail.`;

  try {
    logger.info(`Generating chat response using ${env.AI_PROVIDER} provider`);
    
    let responseContent: string | null = null;

    if (env.AI_PROVIDER === 'openai') {
      if (!openai) throw new Error('OpenAI client not initialized');
      responseContent = await generateChatWithOpenAI(contextPrompt, messages);
    } else if (env.AI_PROVIDER === 'gemini') {
      if (!gemini) throw new Error('Gemini client not initialized');
      responseContent = await generateChatWithGemini(contextPrompt, messages);
    } else if (env.AI_PROVIDER === 'mock') {
      responseContent = "Hello! I'm Nomora, your travel companion! 🌴 I'm here to help you plan amazing trips around Indonesia. What would you like to explore?";
    } else {
      throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
    }

    if (!responseContent) {
      throw new Error('No response from AI provider');
    }

    logger.info('Successfully generated chat response');
    return responseContent;
  } catch (error) {
    logger.error('Error generating chat response:', {
      error: error instanceof Error ? error.message : String(error),
      provider: env.AI_PROVIDER
    });
    throw new Error('Failed to generate chat response');
  }
};

async function generateChatWithOpenAI(
  contextPrompt: string, 
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string | null> {
  if (!openai) throw new Error('OpenAI client not available');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextPrompt}` },
      ...messages.slice(-10), // Keep last 10 messages for context
    ],
    temperature: 0.8,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || null;
}

async function generateChatWithGemini(
  contextPrompt: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string | null> {
  if (!gemini) throw new Error('Gemini client not available');
  
  const model = gemini.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: `${SYSTEM_PROMPT}\n\n${contextPrompt}`,
  });

  // Convert messages to Gemini format
  const geminiMessages = messages.slice(-10).map(msg => ({
    role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.content }],
  }));

  const result = await model.generateContent({
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 300,
    },
  });

  const response = await result.response;
  return response.text();
}

async function generateCatchphraseWithOpenAI(prompt: string): Promise<string | null> {
  if (!openai) throw new Error('OpenAI client not available');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content || null;
}

async function generateCatchphraseWithGemini(prompt: string): Promise<string | null> {
  if (!gemini) throw new Error('Gemini client not available');
  
  const model = gemini.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 200,
    },
  });

  const response = await result.response;
  return response.text();
}
