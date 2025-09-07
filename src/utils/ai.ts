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

const openrouter = env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

export const SYSTEM_PROMPT = `You are Nomora — a Gen Z travel bestie who totally gets Indonesia vibes! 🌴
Your energy: super empathetic, authentic, and genuinely excited about travel. You speak like a supportive friend who validates feelings while being practical about Indonesian travel (IDR budgets, local transport, hidden gems).
Tone: Use Gen Z language naturally - "lowkey," "no cap," "it's giving," "slaps different," "main character energy," etc.
Always match the user's emotional energy and make them feel seen and understood.`;

// Helper functions for language and cultural context
const getUserLanguageInstructions = (country: string): string => {
  switch (country) {
    case "ID":
      return "Respond in Indonesian (Bahasa Indonesia) with Gen Z slang and expressions commonly used by Indonesian youth.";
    case "ZH":
      return "Respond in Simplified Chinese (简体中文) with contemporary internet slang and expressions used by Chinese Gen Z.";
    case "EN":
    default:
      return "Respond in English with authentic Gen Z slang and expressions.";
  }
};

const getUserCulturalContext = (country: string): string => {
  switch (country) {
    case "ID":
      return "Consider Indonesian travel culture, local destinations, and IDR currency context.";
    case "ZH":
      return "Consider Chinese travel preferences, popular destinations for Chinese travelers, and yuan/travel budget considerations.";
    case "EN":
    default:
      return "Consider international travel context with diverse destination options.";
  }
};

const getLocalizedBudgetMessage = (country: string, budgetLevel: string): string => {
  const messages = {
    "ID": {
      "luxury": "dan bestie, dengan budget segitu kamu bisa benar-benar hidup dalam kemewahan - gak bohong!",
      "high": "dan budget kamu tuh solid banget buat bikin trip yang special!",
      "mid": "dan budget kamu totally workable buat dapetin vibes yang keren!",
      "low": "dan honestly, kita bisa bikin magic happen dengan budget kamu kalau kreatif!",
      "ultra-low": "dan fr kita mungkin harus agak kreatif sama budget itu tapi itu totally valid!"
    },
    "ZH": {
      "luxury": "姐妹，这个预算你真的可以过最奢华的生活 - 不开玩笑！",
      "high": "你的预算很棒，可以让这次旅行变得特别！",
      "mid": "你的预算完全够用，能有很好的体验！",
      "low": "说实话，如果我们有创意的话，你的预算可以创造奇迹！",
      "ultra-low": "真的，我们可能需要对这个预算有点创意，但这完全没问题！"
    },
    "EN": {
      "luxury": "and bestie, with that budget you can literally live your luxury dreams - no cap!",
      "high": "and your budget is giving solid opportunities to make this special!",
      "mid": "and your budget is totally workable for some real good vibes!",
      "low": "and honestly, we can make magic happen with your budget if we're creative!",
      "ultra-low": "and fr we might need to get a little creative with that budget but that's totally valid!"
    }
  };
  
  return messages[country as keyof typeof messages]?.[budgetLevel as keyof typeof messages["EN"]] || messages["EN"][budgetLevel as keyof typeof messages["EN"]];
};

const getLocalizedEmpathyMessage = (country: string, feeling: string): string => {
  const messages = {
    "ID": {
      "sad": "bestie, aku ngerti banget dan perasaan ini valid banget, tapi lowkey trip ini mungkin exactly what your soul needs rn",
      "excited": "YES bestie! energy ini absolutely everything dan kita bakal bikin memorable moments yang iconic",
      "stressed": "honestly bestie, kamu deserve break ini banget dan kita bakal cari perfect healing vibes",
      "neutral": '"{feeling}" is such a valid vibe dan kita totally gonna work with that energy'
    },
    "ZH": {
      "sad": "姐妹，我完全理解你，这种感觉完全有效，但说不定这次旅行正是你的灵魂现在需要的",
      "excited": "YES姐妹！这种能量绝对是一切，我们要创造一些标志性的回忆",
      "stressed": "说实话姐妹，你完全值得这次休息，我们会找到完美的治愈氛围",
      "neutral": '"{feeling}" 是如此有效的氛围，我们完全要配合这种能量'
    },
    "EN": {
      "sad": "bestie, I see you and this feeling is so valid, but lowkey a trip might be exactly what your soul needs rn",
      "excited": "YES bestie! this energy is absolutely everything and we're about to make some iconic memories",
      "stressed": "honestly bestie, you deserve this break so much and we're gonna find the perfect healing vibes",
      "neutral": '"{feeling}" is such a valid vibe and we\'re totally gonna work with that energy'
    }
  };
  
  return messages[country as keyof typeof messages]?.[feeling as keyof typeof messages["EN"]] || messages["EN"][feeling as keyof typeof messages["EN"]];
};

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
    country: string;
  },
  feeling: string,
  budget?: number
): Promise<FeelingValidation> => {
  logger.info(`Generating feeling catchphrase using ${env.AI_PROVIDER} provider`);

  // Use mock data if specified
  if (env.AI_PROVIDER === 'mock') {
    let budgetVibe = "";
    let empathyPhrase = "";
    
    // Budget-aware responses
    if (budget) {
      if (budget > 15000000) {
        budgetVibe = getLocalizedBudgetMessage(userProfile.country, "luxury");
      } else if (budget > 8000000) {
        budgetVibe = getLocalizedBudgetMessage(userProfile.country, "high");
      } else if (budget > 3000000) {
        budgetVibe = getLocalizedBudgetMessage(userProfile.country, "mid");
      } else if (budget > 1000000) {
        budgetVibe = getLocalizedBudgetMessage(userProfile.country, "low");
      } else {
        budgetVibe = getLocalizedBudgetMessage(userProfile.country, "ultra-low");
      }
    }
    
    // Feeling-based empathy
    const feelingLower = feeling.toLowerCase();
    if (feelingLower.includes('sad') || feelingLower.includes('upset') || feelingLower.includes('down')) {
      empathyPhrase = getLocalizedEmpathyMessage(userProfile.country, "sad");
    } else if (feelingLower.includes('excited') || feelingLower.includes('happy') || feelingLower.includes('amazing')) {
      empathyPhrase = getLocalizedEmpathyMessage(userProfile.country, "excited");
    } else if (feelingLower.includes('stress') || feelingLower.includes('overwhelm') || feelingLower.includes('tired')) {
      empathyPhrase = getLocalizedEmpathyMessage(userProfile.country, "stressed");
    } else {
      empathyPhrase = getLocalizedEmpathyMessage(userProfile.country, "neutral").replace("{feeling}", feeling);
    }
    
    return {
      originalFeeling: feeling,
      catchphrase: `${empathyPhrase} ${budgetVibe} ✨`,
      mood: 'positive'
    };
  }

  // Determine budget context for the prompt
  let budgetContext = "They're working with some funds for their travel dreams";
  if (budget) {
    if (budget >= 15000000) {
      budgetContext = `Budget: ${budget.toLocaleString()} IDR - bestie is giving luxury vibes and can basically do anything`;
    } else if (budget >= 8000000) {
      budgetContext = `Budget: ${budget.toLocaleString()} IDR - solid mid-to-high budget, lots of options available`;
    } else if (budget >= 3000000) {
      budgetContext = `Budget: ${budget.toLocaleString()} IDR - decent budget for a good trip with some nice touches`;
    } else if (budget >= 1000000) {
      budgetContext = `Budget: ${budget.toLocaleString()} IDR - budget-conscious but totally doable with creativity`;
    } else {
      budgetContext = `Budget: ${budget.toLocaleString()} IDR - ultra-budget mode, need to be real about free/cheap options`;
    }
  }

  // Determine language and cultural context based on country
  let languageInstructions = "";
  let culturalContext = "";
  
  switch (userProfile.country) {
    case "ID":
      languageInstructions = "Respond in Indonesian (Bahasa Indonesia) with Gen Z slang and expressions commonly used by Indonesian youth.";
      culturalContext = "Consider Indonesian travel culture, local destinations, and IDR currency context.";
      break;
    case "ZH":
      languageInstructions = "Respond in Simplified Chinese (简体中文) with contemporary internet slang and expressions used by Chinese Gen Z.";
      culturalContext = "Consider Chinese travel preferences, popular destinations for Chinese travelers, and yuan/travel budget considerations.";
      break;
    case "EN":
    default:
      languageInstructions = "Respond in English with authentic Gen Z slang and expressions.";
      culturalContext = "Consider international travel context with diverse destination options.";
      break;
  }

  const prompt = `Bestie energy check! 💕

User: ${userProfile.name} (${userProfile.age}yo) from ${userProfile.originCity}, Country: ${userProfile.country}
Current feeling: "${feeling}"
${budgetContext}

LANGUAGE REQUIREMENT: ${languageInstructions}
CULTURAL CONTEXT: ${culturalContext}

Your mission: Create a Gen Z catchphrase (20-35 words) that:
- Totally validates their feeling (no toxic positivity!)
- Acknowledges their budget reality (without being weird about it)
- If they seem upset/sad → give gentle encouragement while keeping it real
- If they're being unrealistic with their budget → throw in a light, friendly joke but stay supportive
- If they have a huge budget → hype them up about the luxury possibilities
- Gets them hyped for travel in an authentic way
- Uses Gen Z language naturally appropriate for their country/language
- Feels like their supportive bestie who really gets them

Tone guide based on feelings (adapt to the specified language):
- Upset/sad feelings → validate and gently encourage
- Excited feelings → match their energy and amplify the excitement
- Stressed/overwhelmed → offer comfort and healing vibes
- Unrealistic vibes → loving reality check while staying supportive
- High budget + any feeling → acknowledge luxury possibilities

Mood categories: positive, neutral, adventurous, relaxed, excited, contemplative

Output ONLY this JSON (with the catchphrase in the appropriate language):
{
  "originalFeeling": "${feeling}",
  "catchphrase": "your empathetic gen z bestie catchphrase here IN THE APPROPRIATE LANGUAGE",
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
    } else if (env.AI_PROVIDER === 'openrouter') {
      if (!openrouter) throw new Error('OpenRouter client not initialized');
      responseContent = await generateCatchphraseWithOpenRouter(prompt);
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
    
    // Fallback catchphrase with budget awareness
    let fallbackPhrase = `"${feeling}" - bestie, every feeling is lowkey perfect for an adventure!`;
    if (budget) {
      if (budget > 10000000) {
        fallbackPhrase += " And with that budget? You're about to have the most iconic trip ever, no cap! ✨";
      } else if (budget < 1000000) {
        fallbackPhrase += " We might need to get creative with that budget but honestly the best trips are sometimes the most unexpected ones! ✨";
      } else {
        fallbackPhrase += " Let's make some main character memories that fit your vibe perfectly! ✨";
      }
    } else {
      fallbackPhrase += " Let's go make some main character memories! ✨";
    }
    
    return {
      originalFeeling: feeling,
      catchphrase: fallbackPhrase,
      mood: 'positive'
    };
  }
};

export const generatePlanSuggestions = async (
  userProfile: {
    name: string;
    age: number;
    originCity: string;
    country: string;
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

  const userPrompt = `Bestie check-in! 💫
User: ${userProfile.name} (${userProfile.age}yo) from ${userProfile.originCity}, Country: ${userProfile.country}
Current vibe: "${tripRequest.feeling}"
Trip deets: ${tripRequest.days} days, ${tripRequest.budget} IDR budget

LANGUAGE REQUIREMENT: ${getUserLanguageInstructions(userProfile.country)}
CULTURAL CONTEXT: ${getUserCulturalContext(userProfile.country)}

Mission: Create 4 travel plans that totally GET their feeling! Each plan should feel like it was made just for their current mood.

CRITICAL BUDGET RULES:
🚨 NEVER exceed ${tripRequest.budget} IDR - this is their absolute limit!

BUDGET CATEGORIES & RECOMMENDATIONS:
💸 Ultra High Budget (15M+ IDR):
- Luxury resorts, private villas, 5-star hotels
- Private jets/helicopters, luxury car rentals
- Michelin dining, exclusive experiences, VIP tours
- Premium spas, private yacht charters, golf courses

💰 High Budget (8-15M IDR):
- 4-5 star hotels, boutique resorts
- Business class flights, premium transport
- Fine dining, exclusive activities, guided tours
- Luxury shopping, high-end experiences

💵 Mid Budget (3-8M IDR):
- 3-4 star hotels, nice guesthouses
- Economy flights, comfortable transport
- Mix of restaurants and local dining
- Popular attractions, some premium activities

💴 Low Budget (1-3M IDR):
- Budget hotels, hostels, homestays
- Public transport, economy options
- Local warungs, street food, self-cooking
- Free attractions, budget activities

🪙 Ultra Low Budget (Under 1M IDR):
- Stay local/home, free activities only
- Walking, cycling, public transport
- Home cooking, street food, picnics
- Parks, beaches, hiking, free events

MATCH THE BUDGET ENERGY:
- High budget = suggest luxury experiences they can actually afford
- Low budget = prioritize FREE activities and creative alternatives
- If transportation costs eat the budget, suggest local/nearby destinations instead
- Be realistic but aspirational within their means

COST CALCULATION REQUIREMENTS:
Calculate realistic IDR costs including:
- Transportation from ${userProfile.originCity} to destination (flight/train/bus) - suggest cheaper alternatives if needed
- Local transportation (walking, cycling, ojek, grab, bus, rental)
- Accommodation (budget hostels, guesthouses, homestays, or suggest staying local)
- Food & drinks (street food, warungs, home cooking, picnics - keep it affordable!)
- Activities & attractions (prioritize FREE options: beaches, hiking, local markets, parks)
- Shopping & miscellaneous (minimal - only if budget allows)

Budget-conscious options:
- Ultra-budget (Under 1M): Local exploration, free activities, home base, walking/cycling, street food
- Low-budget (1-3M): Nearby destinations, hostels, public transport, mix of free and paid activities
- Mid-range (3-8M): Regional travel, 3-star hotels, some paid attractions, local dining
- High-budget (8-15M): Premium hotels, business flights, fine dining, exclusive experiences
- Ultra-luxury (15M+): 5-star resorts, private transport, VIP experiences, luxury everything

ADAPT TO THEIR BUDGET REALITY:
- High budget? Suggest that luxury resort in Bali, private villa experiences, helicopter tours
- Medium budget? Mix of comfort and adventure with nice hotels and popular attractions  
- Low budget? Focus on authentic local experiences, free nature activities, budget accommodations
- Ultra low? Stay local, explore neighborhood gems, free outdoor activities, home-based relaxation

Requirements for each option (RESPOND IN THE APPROPRIATE LANGUAGE):
- id (opt_1 to opt_4)
- title (Gen Z friendly, feeling-focused, budget-aware, in appropriate language)
- summary (1-2 sentences that validate their vibe AND acknowledge their budget reality, in appropriate language)
- estimatedCost (MUST be ≤ ${tripRequest.budget} IDR - include ALL components)
- highlights (4-7 activities that match their emotional energy AND budget - emphasize free/cheap options with Gen Z language in appropriate language)
- suitabilityScore (0.0-1.0 based on feeling match AND budget fit)

Make the highlights feel PERSONAL to their mood while being budget-smart:
- Stressed + High Budget → luxury healing: premium spa retreats, private beach resorts, 5-star wellness centers
- Stressed + Low Budget → free healing vibes: beach walks, park meditation, home spa days
- Excited + High Budget → premium adventures: helicopter tours, luxury safari, VIP experiences
- Excited + Low Budget → free adventures: hiking, exploring local areas, street photography
- Romantic + High Budget → luxury couple moments: private dining, resort suites, couple spa packages
- Romantic + Low Budget → budget couple moments: sunset picnics, home movie nights, local walks

Output ONLY this JSON (with all text content in the appropriate language):
{
  "options": [
    {
      "id": "string",
      "title": "string (in appropriate language)", 
      "summary": "string (in appropriate language)",
      "estimatedCost": 0,
      "highlights": ["string (in appropriate language)"],
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
    } else if (env.AI_PROVIDER === 'openrouter') {
      if (!openrouter) throw new Error('OpenRouter client not initialized');
      responseContent = await generateWithOpenRouter(userPrompt);
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
    model: 'gemini-2.5-flash-lite',
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
    country: string;
  },
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  chosenPlan?: { title: string }
): Promise<string> => {
  const contextPrompt = `Bestie vibes only! 💕
User: ${userProfile.name} (${userProfile.age}yo) from ${userProfile.city}, Country: ${userProfile.country}${
    chosenPlan ? `\nTheir chosen adventure: ${chosenPlan.title}` : ''
  }

LANGUAGE REQUIREMENT: ${getUserLanguageInstructions(userProfile.country)}
CULTURAL CONTEXT: ${getUserCulturalContext(userProfile.country)}

Your energy:
- Talk like their supportive Gen Z bestie who's genuinely excited about travel
- Use Gen Z language naturally appropriate for their country/language
- Be empathetic and validate their feelings
- Keep it under 180 words unless they ask for more deets
- Give practical advice but make it feel like friendly suggestions`;

  try {
    logger.info(`Generating chat response using ${env.AI_PROVIDER} provider`);
    
    let responseContent: string | null = null;

    if (env.AI_PROVIDER === 'openai') {
      if (!openai) throw new Error('OpenAI client not initialized');
      responseContent = await generateChatWithOpenAI(contextPrompt, messages);
    } else if (env.AI_PROVIDER === 'gemini') {
      if (!gemini) throw new Error('Gemini client not initialized');
      responseContent = await generateChatWithGemini(contextPrompt, messages);
    } else if (env.AI_PROVIDER === 'openrouter') {
      if (!openrouter) throw new Error('OpenRouter client not initialized');
      responseContent = await generateChatWithOpenRouter(contextPrompt, messages);
    } else if (env.AI_PROVIDER === 'mock') {
      responseContent = "Heyy bestie! 💕 I'm Nomora, your Gen Z travel companion who's absolutely here for all your Indonesia adventure vibes! What kind of energy are you bringing to your next trip? Let's make some main character memories! ✨";
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

async function generateWithOpenRouter(prompt: string): Promise<string | null> {
  if (!openrouter) throw new Error('OpenRouter client not available');
  
  const completion = await openrouter.chat.completions.create({
    model: 'deepseek/deepseek-chat-v3.1:free',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content || null;
}

async function generateChatWithOpenRouter(
  contextPrompt: string, 
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string | null> {
  if (!openrouter) throw new Error('OpenRouter client not available');
  
  const completion = await openrouter.chat.completions.create({
    model: 'deepseek/deepseek-chat-v3.1:free',
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextPrompt}` },
      ...messages.slice(-10), // Keep last 10 messages for context
    ],
    temperature: 0.8,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || null;
}

async function generateCatchphraseWithOpenRouter(prompt: string): Promise<string | null> {
  if (!openrouter) throw new Error('OpenRouter client not available');
  
  const completion = await openrouter.chat.completions.create({
    model: 'deepseek/deepseek-chat-v3.1:free',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  return completion.choices[0]?.message?.content || null;
}
