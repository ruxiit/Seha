/**
 * ================================================================
 * Seha Platform – Telegram-Inspired E2EE Cryptography Module
 * ================================================================
 *
 * ARCHITECTURE (Two-Layer Encrypted Prescription):
 *
 * When doctor issues a prescription, TWO separate encrypted blobs are created:
 *
 *  LAYER 1 – Patient Layer (Full E2EE):
 *    [Doctor] encrypts full prescription (diagnosis, history notes, meds)
 *             with the Patient's RSA Public Key.
 *    [Server] stores encrypted_blob → cannot read it.
 *    [Patient] decrypts with RSA Private Key on their device.
 *
 *  LAYER 2 – Pharmacy Layer (Limited View, Doctor-generated):
 *    [Doctor] encrypts a minimal payload (patient name + medications only)
 *             with a random ephemeral AES-GCM key.
 *    [Server] stores pharmacy_encrypted_blob → cannot read it (no key).
 *    The AES key is embedded in the QR code URL FRAGMENT (#key=...).
 *    Fragments are NEVER sent to the server by HTTP spec.
 *    [Doctor] generates a PDF with the QR → patient gets printed copy.
 *    [Pharmacist] scans QR → gets (prescriptionId, aesKey) →
 *                 fetches pharmacy_encrypted_blob from server →
 *                 decrypts locally → sees patient name + medications ONLY.
 *
 * PATIENT OFFLINE SCENARIO:
 *    Patient with no smartphone / no internet simply presents the
 *    printed paper with the QR code at the pharmacy. No app needed.
 *    The pharmacist's terminal does all the work.
 *
 * ALGORITHMS:
 *  - Patient layer:             RSA-OAEP (hybrid with AES-GCM for large data)
 *  - Patient private key:       AES-GCM + PBKDF2 (310k iterations, derived from NIN)
 *  - Pharmacy layer:            AES-GCM with random 256-bit ephemeral key
 *  - QR key transport:          URL fragment (never reaches server)
 *  - Patient identity:          SHA-256 (NIN hashed, plaintext never stored)
 * ================================================================
 */

'use client';

const RSA_KEY_SIZE = 2048;
const AES_KEY_SIZE = 256;
const PBKDF2_ITERATIONS = 310_000; // NIST 2023 recommendation

// ─────────────────────────────────────────────────────────────
// SHARED DATA TYPES
// ─────────────────────────────────────────────────────────────

export interface PrescriptionData {
  patientName: string;
  patientNin: string;    // hashed before sending to server
  doctorName: string;
  doctorLicenseNo: string;
  date: string;
  diagnosis?: string;
  medications: { name: string; dosage: string; duration?: string }[];
  notes?: string;
  pharmacyKey?: string; // Attached so patient app can regenerate QR
  prescriptionId?: string; // Injected on decryption
  status?: 'pending' | 'dispensed'; // Injected post-decryption
}

/** The pharmacy sees ONLY this subset – zero access to diagnosis or history */
export interface PharmacyPayload {
  prescriptionId: string;
  patientName: string;
  doctorName: string;
  issuedAt: string;
  medications: { name: string; dosage: string; duration?: string }[];
}

// ─────────────────────────────────────────────────────────────
// LAYER 2 – PHARMACY LAYER  (Doctor-generated, patient-offline-safe)
// ─────────────────────────────────────────────────────────────

/**
 * [Doctor] Create the pharmacy-layer blob at prescription time.
 *
 * Returns:
 *  - pharmacyBlob: stored in the backend (Prescriptions.pharmacy_encrypted_blob)
 *  - pharmacyKey:  embedded in the QR URL fragment (#key=...)
 *                  → Pharmacist gets it from QR, server NEVER sees it
 */
export async function encryptPharmacyLayer(
  prescriptionId: string,
  prescription: PrescriptionData
): Promise<{ pharmacyBlob: string; pharmacyKey: string }> {
  const payload: PharmacyPayload = {
    prescriptionId,
    patientName: prescription.patientName,
    doctorName: prescription.doctorName,
    issuedAt: new Date().toISOString(),
    medications: prescription.medications,
  };

  // Generate fresh ephemeral AES key — one per prescription
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_SIZE },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const rawKey = await window.crypto.subtle.exportKey('raw', aesKey);

  const pharmacyBlob = btoa(
    JSON.stringify({
      iv: bufferToBase64(iv.buffer),
      data: bufferToBase64(ciphertext),
    })
  );

  return {
    pharmacyBlob,
    pharmacyKey: bufferToBase64(rawKey),
  };
}

/**
 * Build the QR URL that goes into the printed PDF.
 *
 * Format: https://seha.dz/verify?id=RX-2026-001#key=<base64AESkey>
 *
 * IMPORTANT: The #key fragment is NEVER sent to the server by the browser.
 * The pharmacist's app reads it client-side and decrypts locally.
 */
export function buildQRUrl(
  prescriptionId: string,
  pharmacyKey: string,
  baseUrl?: string
): string {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://seha.dz');
  return `${origin}/verify?id=${encodeURIComponent(prescriptionId)}#key=${encodeURIComponent(pharmacyKey)}`;
}

/**
 * [Pharmacist] Decrypt the pharmacy blob received from the server.
 * The pharmacyKey comes from the scanned QR URL fragment — server never sees it.
 */
export async function decryptPharmacyLayer(
  pharmacyBlob: string,
  pharmacyKey: string
): Promise<PharmacyPayload | null> {
  try {
    const { iv, data } = JSON.parse(atob(pharmacyBlob));

    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      base64ToBuffer(pharmacyKey),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuffer(iv) },
      aesKey,
      base64ToBuffer(data)
    );

    return JSON.parse(new TextDecoder().decode(plaintext)) as PharmacyPayload;
  } catch (err: any) {
    console.error('[SehaE2EE] Pharmacy layer decryption failed:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 1 – PATIENT LAYER  (RSA-OAEP hybrid encryption)
// ─────────────────────────────────────────────────────────────

/**
 * [Doctor] Generate an RSA-OAEP key pair for a patient.
 * Public key → stored on server.
 * Private key → encrypted with patient's NIN and stored in their localStorage.
 */
export async function generatePatientKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: RSA_KEY_SIZE,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const buf = await window.crypto.subtle.exportKey('spki', key);
  return bufferToBase64(buf);
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'spki',
    base64ToBuffer(base64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

export async function importPrivateKey(base64: string): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'pkcs8',
    base64ToBuffer(base64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

/**
 * [Doctor] Encrypt the full prescription for the patient.
 * Hybrid: random AES-GCM key is wrapped with the patient's RSA public key.
 */
export async function encryptPrescriptionForPatient(
  prescription: PrescriptionData,
  patientPublicKey: CryptoKey
): Promise<string> {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_SIZE },
    true,
    ['encrypt', 'decrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(prescription));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plaintext
  );

  const rawAes = await window.crypto.subtle.exportKey('raw', aesKey);
  const wrappedKey = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    patientPublicKey,
    rawAes
  );

  return btoa(
    JSON.stringify({
      v: 1,
      wrappedKey: bufferToBase64(wrappedKey),
      iv: bufferToBase64(iv.buffer),
      ciphertext: bufferToBase64(ciphertext),
    })
  );
}

/**
 * [Patient] Decrypt their own prescription.
 * The RSA private key never leaves the patient's device.
 */
export async function decryptPrescription(
  envelopeBase64: string,
  privateKey: CryptoKey
): Promise<PrescriptionData> {
  const envelope = JSON.parse(atob(envelopeBase64));

  const rawAes = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToBuffer(envelope.wrappedKey)
  );

  const aesKey = await window.crypto.subtle.importKey(
    'raw', rawAes, { name: 'AES-GCM' }, false, ['decrypt']
  );

  const plaintext = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(envelope.iv) },
    aesKey,
    base64ToBuffer(envelope.ciphertext)
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ─────────────────────────────────────────────────────────────
// PATIENT PRIVATE KEY – LOCAL PROTECTION  (PBKDF2 + AES-GCM)
// ─────────────────────────────────────────────────────────────

/**
 * Encrypt the patient's private key with their NIN as the passphrase.
 * The result is a JSON string safe to store in localStorage.
 */
export async function protectPrivateKey(
  privateKey: CryptoKey,
  nin: string
): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrapKey = await deriveAesFromNin(nin, salt);

  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrapKey,
    pkcs8
  );

  return JSON.stringify({
    v: 1,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(encrypted),
  });
}

/**
 * Restore the patient's private key using their NIN.
 * Throws if the NIN is wrong (decryption fails = authentication failed).
 */
export async function restorePrivateKey(
  encryptedJson: string,
  nin: string
): Promise<CryptoKey> {
  const { salt, iv, data } = JSON.parse(encryptedJson);
  const wrapKey = await deriveAesFromNin(nin, base64ToBuffer(salt));

  let pkcs8: ArrayBuffer;
  try {
    pkcs8 = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuffer(iv) },
      wrapKey,
      base64ToBuffer(data)
    );
  } catch {
    throw new Error('فشل التحقق: الرقم الوطني غير صحيح أو الجهاز غير المسجّل.');
  }

  return await window.crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

async function deriveAesFromNin(
  nin: string,
  salt: ArrayBuffer | Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw', enc.encode(nin), 'PBKDF2', false, ['deriveKey']
  );
  // Ensure we have a concrete ArrayBuffer (not SharedArrayBuffer) for Web Crypto API
  const saltBuffer: ArrayBuffer =
    salt instanceof Uint8Array ? salt.buffer as ArrayBuffer : salt;

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltBuffer),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_SIZE },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─────────────────────────────────────────────────────────────
// PATIENT IDENTITY
// ─────────────────────────────────────────────────────────────

/** Hash the NIN using SHA-256. Server stores only the hash, never the raw NIN. */
export async function hashNIN(nin: string): Promise<string> {
  const buf = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(nin)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─────────────────────────────────────────────────────────────
// LOCAL KEY STORE HELPERS
// ─────────────────────────────────────────────────────────────

const LS_PREFIX = 'seha_pk_';

export function saveEncryptedPrivateKey(ninHash: string, encryptedJson: string): void {
  try { localStorage.setItem(`${LS_PREFIX}${ninHash}`, encryptedJson); } catch {}
}

export function loadEncryptedPrivateKey(ninHash: string): string | null {
  try { return localStorage.getItem(`${LS_PREFIX}${ninHash}`); } catch { return null; }
}

export function hasLocalKeyPair(ninHash: string): boolean {
  try { return !!localStorage.getItem(`${LS_PREFIX}${ninHash}`); } catch { return false; }
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
