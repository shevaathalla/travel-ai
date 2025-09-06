import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createChatSchema, addMessageSchema } from '../schemas/chat.schema';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/', validateBody(createChatSchema), chatController.createChat as any);
router.get('/', chatController.getUserChats as any);
router.get('/:id', chatController.getChatDetail as any);
router.post('/:id/messages', validateBody(addMessageSchema), chatController.addMessage as any);

export default router;
