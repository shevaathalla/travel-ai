import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { updateUserSchema } from '../schemas/user.schema';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', userController.getProfile as any);
router.patch('/', validateBody(updateUserSchema), userController.updateProfile as any);

export default router;
