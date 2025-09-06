import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';
import { UpdateUserInput } from '../schemas/user.schema';
import { logger } from '../config/logger';

export const userController = {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const profile = await userService.getProfile(userId);
      
      res.json(profile);
    } catch (error) {
      logger.error('Get profile error:', error);
      
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'USER_NOT_FOUND',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to get profile',
          code: 'PROFILE_ERROR',
        },
      });
    }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const input = req.body as UpdateUserInput;
      const profile = await userService.updateProfile(userId, input);
      
      res.json(profile);
    } catch (error) {
      logger.error('Update profile error:', error);
      
      res.status(500).json({
        error: {
          message: 'Failed to update profile',
          code: 'UPDATE_PROFILE_ERROR',
        },
      });
    }
  },
};
