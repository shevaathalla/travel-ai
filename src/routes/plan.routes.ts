import { Router } from 'express';
import { planController } from '../controllers/plan.controller';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { chooseOptionSchema } from '../schemas/plan.schema';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', planController.getUserPlans as any);
router.get('/:id', planController.getPlanDetail as any);
router.post('/:id/choose', validateBody(chooseOptionSchema), planController.chooseOption as any);
router.delete('/:id', planController.deletePlan as any);

export default router;
