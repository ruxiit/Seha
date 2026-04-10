import { Router } from 'express';
import { getStats, getSecurityLogs } from '../controllers/admin.controller';
import { verifyToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes are protected – only role 'admin' can access
router.get('/stats', verifyToken, authorizeRole(['admin']), getStats);
router.get('/security-logs', verifyToken, authorizeRole(['admin']), getSecurityLogs);

export default router;
