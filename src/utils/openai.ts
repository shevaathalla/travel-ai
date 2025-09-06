import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { mockPlanSuggestions } from './mockData';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Set to true to use mock data when OpenAI API is unavailable
const USE_MOCK_DATA = true;

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
  // Temporary mock data for testing when OpenAI API quota is exceeded
  if (USE_MOCK_DATA) {
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
    logger.info('Generating plan suggestions with OpenAI');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]) as PlanSuggestionResponse;
    
    // Validate response structure
    if (!parsedResponse.options || !Array.isArray(parsedResponse.options) || parsedResponse.options.length !== 4) {
      throw new Error('Invalid response structure from OpenAI');
    }

    logger.info('Successfully generated plan suggestions');
    return parsedResponse;
  } catch (error) {
    logger.error('Error generating plan suggestions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userProfile,
      tripRequest
    });
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing');
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error('OpenAI API quota exceeded or billing issue');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI API rate limit exceeded');
      }
      if (error.message.includes('timeout')) {
        throw new Error('OpenAI API request timeout');
      }
    }
    
    throw new Error('Failed to generate plan suggestions');
  }
};

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
    logger.info('Generating chat response with OpenAI');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextPrompt}` },
        ...messages.slice(-10), // Keep last 10 messages for context
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    logger.info('Successfully generated chat response');
    return responseContent;
  } catch (error) {
    logger.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
};
