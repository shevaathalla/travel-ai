import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { aiService } from '../services/ai.service';
import { PlanSuggestionInput } from '../schemas/ai.schema';
import { logger } from '../config/logger';

export const aiController = {
  async suggestPlans(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const input = req.body as PlanSuggestionInput;
      const result = await aiService.suggestPlans(userId, input);
      
      res.json(result);
    } catch (error) {
      logger.error('Suggest plans error:', error);
      
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'USER_NOT_FOUND',
          },
        });
        return;
      }
      
      if (error instanceof Error && error.message.includes('quota')) {
        res.status(503).json({
          error: {
            message: 'AI service quota exceeded. Please try again later.',
            code: 'AI_QUOTA_EXCEEDED',
          },
        });
        return;
      }
      
      if (error instanceof Error && error.message.includes('API key')) {
        res.status(503).json({
          error: {
            message: 'AI service configuration error. Please contact support.',
            code: 'AI_CONFIG_ERROR',
          },
        });
        return;
      }
      
      if (error instanceof Error && (error.message === 'Failed to generate plan suggestions' || error.message.includes('OpenAI'))) {
        res.status(503).json({
          error: {
            message: 'AI service is currently unavailable. Please try again later.',
            code: 'AI_SERVICE_ERROR',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to generate plan suggestions',
          code: 'PLAN_SUGGESTION_ERROR',
        },
      });
    }
  },
};
