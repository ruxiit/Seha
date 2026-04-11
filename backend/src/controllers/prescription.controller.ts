import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { hashNIN } from '../utils/crypto';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

// ─────────────────────────────────────────────────────────────
// CREATE PRESCRIPTION  [Doctor]
// POST /api/prescriptions
// ─────────────────────────────────────────────────────────────
/**
 * Body:
 *  - encrypted_blob:          full E2EE prescription (RSA-encrypted for patient)
 *  - pharmacy_encrypted_blob: pharmacy-only view (AES-encrypted, key is in QR fragment)
 *  - patient_nin:             patient's plain NIN (hashed server-side, never stored plain)
 *
 * The server stores both blobs but CANNOT read either of them.
 */
export const createPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { encrypted_blob, pharmacy_encrypted_blob, patient_nin } = req.body;
    const doctor_id = req.user?.id || req.body.doctor_id;

    if (!doctor_id || !encrypted_blob || !patient_nin) {
      const error = new Error('Missing required fields: encrypted_blob, patient_nin') as AppError;
      error.status = 400; throw error;
    }

    const nin_hash = hashNIN(patient_nin);

    // Find or create patient record
    let { data: patient, error: patientError } = await supabase
      .from('Patients')
      .select('id')
      .eq('nin_hash', nin_hash)
      .single();

    if (patientError && patientError.code !== 'PGRST116') throw patientError;

    let patient_id = patient?.id;

    if (!patient) {
      const { data: newPatient, error: createError } = await supabase
        .from('Patients')
        .insert([{ nin_hash, medical_history_encrypted: 'none' }])
        .select()
        .single();
      if (createError) throw createError;
      patient_id = newPatient.id;
    }

    // Store prescription with both encrypted layers
    const { data: prescription, error: prescriptionError } = await supabase
      .from('Prescriptions')
      .insert([{
        doctor_id,
        patient_id,
        encrypted_blob,
        pharmacy_encrypted_blob: pharmacy_encrypted_blob || null,
        status: 'pending',
      }])
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription.id,
        status: prescription.status,
        created_at: prescription.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET PRESCRIPTION FOR PHARMACIST  [Pharmacist]
// GET /api/prescriptions/:id
// ─────────────────────────────────────────────────────────────
/**
 * Returns ONLY the pharmacy_encrypted_blob (the limited-view layer).
 * The full encrypted_blob is NEVER returned to the pharmacist.
 * The pharmacist decrypts the pharmacy blob client-side using the key
 * from the QR URL fragment — the server never has that key.
 */
export const getPrescriptionForPharmacist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: prescription, error } = await supabase
      .from('Prescriptions')
      .select('pharmacy_encrypted_blob, status')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const err = new Error('Prescription not found') as AppError;
        err.status = 404; throw err;
      }
      throw error;
    }

    if (prescription.status === 'dispensed') {
      const err = new Error('هذه الوصفة صُرفت مسبقاً — محاولة تكرار مرفوضة.') as AppError;
      err.status = 403; throw err;
    }

    if (prescription.status !== 'pending') {
      const err = new Error('الوصفة غير صالحة للصرف.') as AppError;
      err.status = 403; throw err;
    }

    res.status(200).json({
      pharmacy_encrypted_blob: prescription.pharmacy_encrypted_blob,
      status: prescription.status,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DISPENSE PRESCRIPTION  [Pharmacist]
// PATCH /api/prescriptions/:id/dispense
// ─────────────────────────────────────────────────────────────
/**
 * Marks the prescription as dispensed. Prevents double-dispensing.
 * The pharmacist POSTs with their authenticated identity for the audit log.
 */
export const dispensePrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pharmacist_id = req.user?.id || req.body.pharmacist_id;

    const { data: prescription, error: fetchError } = await supabase
      .from('Prescriptions')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        const err = new Error('Prescription not found') as AppError;
        err.status = 404; throw err;
      }
      throw fetchError;
    }

    if (prescription.status === 'dispensed') {
      const err = new Error('تحذير أمني: تم صرف هذه الوصفة مسبقاً. محاولة تكرار محظورة.') as AppError;
      err.status = 403; throw err;
    }

    const { data: updated, error: updateError } = await supabase
      .from('Prescriptions')
      .update({
        status: 'dispensed',
        dispensed_by: pharmacist_id || null,
        dispensed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, dispensed_at')
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      message: 'تم صرف الوصفة بنجاح وتسجيلها في الشبكة الوطنية.',
      prescription: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET PATIENT PRESCRIPTIONS  [Patient]
// GET /api/prescriptions/patient/:nin_hash
// ─────────────────────────────────────────────────────────────
/**
 * Returns the patient's own prescriptions (encrypted_blob only).
 * Only the patient can decrypt them with their local RSA private key.
 */
export const getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin_hash } = req.params;

    const { data: patient, error: patientError } = await supabase
      .from('Patients')
      .select('id')
      .eq('nin_hash', nin_hash)
      .single();

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        res.status(200).json({ prescriptions: [] }); return;
      }
      throw patientError;
    }

    const { data: prescriptions, error } = await supabase
      .from('Prescriptions')
      .select('id, encrypted_blob, status, created_at, doctor_id')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ prescriptions: prescriptions || [] });
  } catch (error) {
    next(error);
  }
};
