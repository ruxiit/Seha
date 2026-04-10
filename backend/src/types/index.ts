import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
}

export interface User {
  id: string;
  nin_hash: string;
  role: 'doctor' | 'pharmacist' | 'patient' | 'admin';
}

export interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  encrypted_blob: string;              // Full E2EE prescription (RSA-encrypted for patient)
  pharmacy_encrypted_blob: string | null; // Pharmacy-only view (AES-GCM, key in QR fragment)
  status: 'pending' | 'dispensed';
  dispensed_by?: string | null;
  dispensed_at?: string | null;
  created_at: Date;
}

export interface Patient {
  id: string;
  nin_hash: string;
  public_key: string | null;           // RSA public key (SPKI base64) – server stores, never private key
  medical_history_encrypted: string;
}

export interface SecurityLog {
  id: string;
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  created_at: Date;
}