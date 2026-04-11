import { Router } from 'express';
import { register, login, adminLogin, requestOtp, verifyPatientOtp } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/admin-login', adminLogin);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyPatientOtp);

export default router;