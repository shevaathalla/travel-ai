import { z } from 'zod';

export const chooseOptionSchema = z.object({
  optionId: z.string().min(1, 'Option ID is required'),
});

export type ChooseOptionInput = z.infer<typeof chooseOptionSchema>;
