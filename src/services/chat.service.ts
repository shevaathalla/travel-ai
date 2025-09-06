import { PrismaClient } from '@prisma/client';
import { generateChatResponse } from '../utils/ai';
import { CreateChatInput, AddMessageInput } from '../schemas/chat.schema';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface ChatDetail {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface ChatMessageResponse {
  assistant: {
    content: string;
  };
}

export const chatService = {
  async createChat(userId: string, input: CreateChatInput): Promise<ChatSummary> {
    logger.info('Creating new chat:', { userId, title: input.title });

    const chat = await prisma.chat.create({
      data: {
        userId,
        title: input.title || 'New chat',
      },
    });

    logger.info('Chat created successfully:', { chatId: chat.id });
    return {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  },

  async getUserChats(userId: string): Promise<ChatSummary[]> {
    logger.info('Getting user chats:', { userId });

    const chats = await prisma.chat.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats;
  },

  async getChatDetail(chatId: string, userId: string): Promise<ChatDetail> {
    logger.info('Getting chat detail:', { chatId, userId });

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    return {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map((message: any) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    };
  },

  async addMessage(chatId: string, userId: string, input: AddMessageInput): Promise<ChatMessageResponse> {
    logger.info('Adding message to chat:', { chatId, userId, content: input.content });

    // Verify chat exists and belongs to user
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        user: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Get last 10 messages for context
        },
      },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content: input.content,
      },
    });

    // Get user's chosen plan if any (for context)
    const chosenPlan = await prisma.plan.findFirst({
      where: { userId, status: 'chosen' },
      orderBy: { updatedAt: 'desc' },
    });

    // Prepare messages for OpenAI
    const recentMessages = [
      ...chat.messages.reverse().map((msg: any) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      { role: 'user' as const, content: input.content },
    ];

    // Generate AI response
    const aiResponse = await generateChatResponse(
      {
        name: chat.user.name,
        age: chat.user.age,
        city: chat.user.city,
      },
      recentMessages,
      chosenPlan ? { title: (chosenPlan.chosenOption as any)?.title || 'Travel Plan' } : undefined
    );

    // Create assistant message
    await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: aiResponse,
      },
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    logger.info('Message added successfully:', { chatId, messageId: userMessage.id });

    return {
      assistant: {
        content: aiResponse,
      },
    };
  },
};
