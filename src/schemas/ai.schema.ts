import { z } from 'zod';

export const planSuggestionSchema = z.object({
  days: z.number().int().min(1, 'Days must be at least 1').max(30, 'Days cannot exceed 30'),
  budget: z.number().int().min(0, 'Budget must be non-negative'),
  feeling: z.string().min(1, 'Feeling is required').max(100, 'Feeling must be less than 100 characters'),
  originCity: z.string().min(1, 'Origin city is required').max(100, 'Origin city must be less than 100 characters'),
  age: z.number().int().min(0, 'Age must be non-negative').max(120, 'Age must be less than 120'),
});

export type PlanSuggestionInput = z.infer<typeof planSuggestionSchema>;
