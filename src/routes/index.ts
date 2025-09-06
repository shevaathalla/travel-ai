import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import planRoutes from './plan.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Travel AI Backend'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/me', userRoutes);
router.use('/ai', aiRoutes);
router.use('/plans', planRoutes);
router.use('/chats', chatRoutes);

export default router;
