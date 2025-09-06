import { z } from 'zod';

export const createChatSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
});

export const addMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(1000, 'Message must be less than 1000 characters'),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
