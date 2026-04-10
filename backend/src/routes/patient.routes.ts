import { Router } from 'express';
import {
  getPatientPublicKey,
  registerPublicKey,
  getMyHistory,
  getPatientPrescriptionsByHash,
  getPatientProfileByPlainNIN,
} from '../controllers/patient.controller';
import { verifyToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// [Patient] Register or update their RSA public key
router.post('/public-key', registerPublicKey);

// [Doctor] Fetch a patient's public key by plain NIN (to encrypt prescription for them)
router.get('/public-key', verifyToken, authorizeRole(['doctor', 'admin']), getPatientPublicKey);

// [Patient] Get own history (requires JWT auth)
router.get('/history', verifyToken, authorizeRole(['patient']), getMyHistory);

// [Patient] Get own prescriptions by nin_hash (no token needed, secured by knowledge of hash)
router.get('/:nin_hash/prescriptions', getPatientPrescriptionsByHash);

// [Doctor] Get patient profile (name, age) by plain NIN
router.get('/profile', verifyToken, authorizeRole(['doctor', 'admin']), getPatientProfileByPlainNIN);

export default router;
