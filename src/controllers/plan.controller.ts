import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { planService } from '../services/plan.service';
import { ChooseOptionInput } from '../schemas/plan.schema';
import { logger } from '../config/logger';

export const planController = {
  async getUserPlans(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const plans = await planService.getUserPlans(userId);
      
      res.json(plans);
    } catch (error) {
      logger.error('Get user plans error:', error);
      
      res.status(500).json({
        error: {
          message: 'Failed to get plans',
          code: 'GET_PLANS_ERROR',
        },
      });
    }
  },

  async getPlanDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const planId = req.params.id as string;
      const plan = await planService.getPlanDetail(planId, userId);
      
      res.json(plan);
    } catch (error) {
      logger.error('Get plan detail error:', error);
      
      if (error instanceof Error && error.message === 'Plan not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'PLAN_NOT_FOUND',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to get plan detail',
          code: 'GET_PLAN_DETAIL_ERROR',
        },
      });
    }
  },

  async chooseOption(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const planId = req.params.id as string;
      const input = req.body as ChooseOptionInput;
      const chosenOption = await planService.chooseOption(planId, userId, input);
      
      res.json(chosenOption);
    } catch (error) {
      logger.error('Choose option error:', error);
      
      if (error instanceof Error && error.message === 'Plan not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'PLAN_NOT_FOUND',
          },
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Plan option has already been chosen') {
        res.status(409).json({
          error: {
            message: error.message,
            code: 'OPTION_ALREADY_CHOSEN',
          },
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Invalid option ID') {
        res.status(400).json({
          error: {
            message: error.message,
            code: 'INVALID_OPTION_ID',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to choose option',
          code: 'CHOOSE_OPTION_ERROR',
        },
      });
    }
  },

  async deletePlan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const planId = req.params.id as string;
      await planService.deletePlan(planId, userId);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Delete plan error:', error);
      
      if (error instanceof Error && error.message === 'Plan not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'PLAN_NOT_FOUND',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to delete plan',
          code: 'DELETE_PLAN_ERROR',
        },
      });
    }
  },
};
