import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionForPharmacist,
  dispensePrescription,
  getPatientPrescriptions,
} from '../controllers/prescription.controller';
import { verifyToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// [Doctor] Issue a new prescription
router.post('/', verifyToken, authorizeRole(['doctor', 'admin']), createPrescription);

// [Patient] Get own prescriptions by nin_hash (public, secured by knowledge of hashed NIN)
router.get('/patient/:nin_hash', getPatientPrescriptions);

// [Pharmacist] Fetch pharmacy-only blob for dispensing (public, key is in QR fragment)
router.get('/:id', getPrescriptionForPharmacist);

// [Pharmacist] Mark prescription as dispensed
router.patch('/:id/dispense', dispensePrescription);

export default router;
