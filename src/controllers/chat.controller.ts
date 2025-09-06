import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { chatService } from '../services/chat.service';
import { CreateChatInput, AddMessageInput } from '../schemas/chat.schema';
import { logger } from '../config/logger';

export const chatController = {
  async createChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const input = req.body as CreateChatInput;
      const chat = await chatService.createChat(userId, input);
      
      res.status(201).json(chat);
    } catch (error) {
      logger.error('Create chat error:', error);
      
      res.status(500).json({
        error: {
          message: 'Failed to create chat',
          code: 'CREATE_CHAT_ERROR',
        },
      });
    }
  },

  async getUserChats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const chats = await chatService.getUserChats(userId);
      
      res.json(chats);
    } catch (error) {
      logger.error('Get user chats error:', error);
      
      res.status(500).json({
        error: {
          message: 'Failed to get chats',
          code: 'GET_CHATS_ERROR',
        },
      });
    }
  },

  async getChatDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const chatId = req.params.id as string;
      const chat = await chatService.getChatDetail(chatId, userId);
      
      res.json(chat);
    } catch (error) {
      logger.error('Get chat detail error:', error);
      
      if (error instanceof Error && error.message === 'Chat not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'CHAT_NOT_FOUND',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to get chat detail',
          code: 'GET_CHAT_DETAIL_ERROR',
        },
      });
    }
  },

  async addMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const chatId = req.params.id as string;
      const input = req.body as AddMessageInput;
      const response = await chatService.addMessage(chatId, userId, input);
      
      res.json(response);
    } catch (error) {
      logger.error('Add message error:', error);
      
      if (error instanceof Error && error.message === 'Chat not found') {
        res.status(404).json({
          error: {
            message: error.message,
            code: 'CHAT_NOT_FOUND',
          },
        });
        return;
      }
      
      if (error instanceof Error && error.message === 'Failed to generate chat response') {
        res.status(503).json({
          error: {
            message: 'AI service is currently unavailable',
            code: 'AI_SERVICE_ERROR',
          },
        });
        return;
      }
      
      res.status(500).json({
        error: {
          message: 'Failed to add message',
          code: 'ADD_MESSAGE_ERROR',
        },
      });
    }
  },
};
