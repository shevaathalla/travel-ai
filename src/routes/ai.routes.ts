import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { planSuggestionSchema } from '../schemas/ai.schema';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/plan/suggest', validateBody(planSuggestionSchema), aiController.suggestPlans as any);

export default router;
