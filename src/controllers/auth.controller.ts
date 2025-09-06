import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { logger } from '../config/logger';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(input);
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Register error:', error);
      
      if (error instanceof Error && error.message === 'User with this email already exists') {
        res.status(409).json({
          error: {
            message: error.message,
            code: 'EMAIL_ALREADY_EXISTS',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Registration failed',
          code: 'REGISTRATION_ERROR',
        },
      });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input);
      
      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error instanceof Error && error.message === 'Invalid email or password') {
        res.status(401).json({
          error: {
            message: error.message,
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Login failed',
          code: 'LOGIN_ERROR',
        },
      });
    }
  },
};
