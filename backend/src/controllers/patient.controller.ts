import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { hashNIN, decryptData } from '../utils/crypto';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

// ─────────────────────────────────────────────────────────────
// [Doctor] GET /api/patients/public-key?nin=<plain_nin>
// Fetch a patient's RSA public key so the doctor can encrypt for them
// ─────────────────────────────────────────────────────────────
export const getPatientPublicKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nin } = req.query;
    if (!nin || typeof nin !== 'string') {
      const err = new Error('NIN query parameter is required') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);

    const { data: patient, error } = await supabase
      .from('Patients')
      .select('id, public_key')
      .eq('nin_hash', nin_hash)
      .single();

    if (error || !patient || !patient.public_key) {
      res.status(404).json({
        message: 'Patient not found or has no public key registered.',
        nin_hash,
      });
      return;
    }

    res.status(200).json({ nin_hash, public_key: patient.public_key });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// [Patient] POST /api/patients/public-key
// Register or update the patient's RSA public key on the server.
// The PRIVATE key NEVER leaves the patient's device.
// ─────────────────────────────────────────────────────────────
export const registerPublicKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nin, public_key } = req.body;

    if (!nin || !public_key) {
      const err = new Error('nin and public_key are required') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);

    const { data, error } = await supabase
      .from('Patients')
      .upsert(
        { nin_hash, public_key, medical_history_encrypted: 'none' },
        { onConflict: 'nin_hash' }
      )
      .select('id')
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Public key registered successfully.',
      patient_id: data.id,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// [Patient] GET /api/patients/history   (requires JWT)
// Returns the authenticated patient's encrypted prescription list.
// ─────────────────────────────────────────────────────────────
export const getMyHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const nin_hash = req.user?.nin_hash;

    if (!nin_hash) {
      const err = new Error('Unauthorized') as AppError;
      err.status = 401;
      throw err;
    }

    const { data: patient, error: patientError } = await supabase
      .from('Patients')
      .select('id, medical_history_encrypted')
      .eq('nin_hash', nin_hash)
      .single();

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        res.status(200).json({ prescriptions: [], medical_history: null });
        return;
      }
      throw patientError;
    }

    const { data: prescriptions, error: rxError } = await supabase
      .from('Prescriptions')
      .select('id, doctor_id, encrypted_blob, status, created_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (rxError) throw rxError;

    res.status(200).json({
      prescriptions: prescriptions || [],
      medical_history: patient.medical_history_encrypted,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// [Patient] GET /api/patients/:nin_hash/prescriptions
// Fetch prescriptions by nin_hash (no token required —
// knowledge of the hash is the proof of identity here).
// ─────────────────────────────────────────────────────────────
export const getPatientPrescriptionsByHash = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nin_hash } = req.params;

    const { data: patient, error: patientError } = await supabase
      .from('Patients')
      .select('id')
      .eq('nin_hash', nin_hash)
      .single();

    if (patientError) {
      if (patientError.code === 'PGRST116') {
        // Patient exists nowhere yet — return empty list
        res.status(200).json({ prescriptions: [] });
        return;
      }
      throw patientError;
    }

    const { data: prescriptions, error } = await supabase
      .from('Prescriptions')
      .select('id, doctor_id, encrypted_blob, status, created_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ prescriptions: prescriptions || [] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// [Doctor] GET /api/patients/profile?nin=<plain_nin>
// Fetch a patient's name and age by decrypting their profile using the server key
// ─────────────────────────────────────────────────────────────
export const getPatientProfileByPlainNIN = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { nin } = req.query;
    if (!nin || typeof nin !== 'string') {
      const err = new Error('NIN query parameter is required') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);

    const { data: user, error } = await supabase
      .from('Users')
      .select('encrypted_profile')
      .eq('nin_hash', nin_hash)
      .eq('role', 'patient')
      .single();

    if (error || !user || !user.encrypted_profile) {
      res.status(404).json({ message: 'Patient profile not found.' });
      return;
    }

    let profile: any = {};
    try {
      profile = JSON.parse(decryptData(user.encrypted_profile));
    } catch (e) {
      console.error('Failed to decrypt patient profile', e);
    }

    res.status(200).json({ name: profile.name || '', age: profile.age || '' });
  } catch (error) {
    next(error);
  }
};

