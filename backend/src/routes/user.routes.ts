import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getMe, updateMe } from '../controllers/user.controller';

const router = Router();

router.get('/me',  verifyToken, getMe);
router.put('/me',  verifyToken, updateMe);

export default router;