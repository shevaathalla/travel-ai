import { PrismaClient } from '@prisma/client';
import { generatePlanSuggestions, generateFeelingCatchphrase, PlanSuggestionResponse } from '../utils/ai';
import { PlanSuggestionInput } from '../schemas/ai.schema';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface PlanSuggestionResult {
  planId: string;
  options: PlanSuggestionResponse['options'];
  feelingValidation: {
    originalFeeling: string;
    catchphrase: string;
    mood: 'positive' | 'neutral' | 'adventurous' | 'relaxed' | 'excited' | 'contemplative';
  };
}

export const aiService = {
  async suggestPlans(userId: string, input: PlanSuggestionInput): Promise<PlanSuggestionResult> {
    logger.info('Generating plan suggestions:', { userId, input });

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, age: true, country: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Use age from input if provided, otherwise use user's profile age
    const userAge = input.age || user.age;

    // Generate feeling catchphrase
    const feelingValidation = await generateFeelingCatchphrase(
      {
        name: user.name,
        age: userAge,
        originCity: input.originCity,
        country: (user as any).country || 'ID', // Fallback to ID if country not available
      },
      input.feeling,
      input.budget // Pass the budget to the catchphrase generation
    );

    // Generate suggestions using AI
    const suggestions = await generatePlanSuggestions(
      {
        name: user.name,
        age: userAge,
        originCity: input.originCity,
        country: (user as any).country || 'ID', // Fallback to ID if country not available
      },
      {
        days: input.days,
        budget: input.budget,
        feeling: input.feeling,
      }
    );

    // Save plan to database
    const plan = await prisma.plan.create({
      data: {
        userId,
        days: input.days,
        budget: input.budget,
        feeling: input.feeling,
        originCity: input.originCity,
        optionsJson: suggestions.options as any,
        status: 'suggested',
      },
    });

    logger.info('Plan suggestions saved successfully:', { planId: plan.id });

    return {
      planId: plan.id,
      options: suggestions.options,
      feelingValidation,
    };
  },
};
