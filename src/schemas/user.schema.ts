import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters').optional(),
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Age must be less than 120').optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
