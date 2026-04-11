-- 1. Enable UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Users table
CREATE TABLE IF NOT EXISTS "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nin_hash TEXT UNIQUE NOT NULL,
    phone_hash TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    encrypted_profile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the Patients table
CREATE TABLE IF NOT EXISTS "Patients" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nin_hash TEXT UNIQUE NOT NULL,
    public_key TEXT,
    medical_history_encrypted TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create the Prescriptions table
CREATE TABLE IF NOT EXISTS "Prescriptions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES "Patients"(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL, 
    encrypted_blob TEXT NOT NULL,
    pharmacy_encrypted_blob TEXT,
    status TEXT DEFAULT 'pending', -- e.g., 'pending', 'dispensed'
    dispensed_by UUID,
    dispensed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4a. Create Diagnoses table (for medical history)
CREATE TABLE IF NOT EXISTS "Diagnoses" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES "Prescriptions"(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES "Patients"(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL,
    diagnosis_name TEXT NOT NULL, -- e.g., 'Hypertension', 'Gastritis'
    icd_code TEXT, -- ICD-10 code
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. Create Medicines table (for prescribed medications)
CREATE TABLE IF NOT EXISTS "Medicines" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES "Prescriptions"(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL, -- e.g., 'Amlodipine', 'Omeprazole'
    dosage TEXT, -- e.g., '5mg', '20mg'
    frequency TEXT, -- e.g., 'once daily', 'twice daily'
    duration TEXT, -- e.g., '30 days', '2 weeks'
    instructions TEXT, -- special instructions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4c. Create Treatments table (lifestyle advice, procedures, etc.)
CREATE TABLE IF NOT EXISTS "Treatments" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES "Prescriptions"(id) ON DELETE CASCADE,
    treatment_type TEXT NOT NULL, -- e.g., 'Lifestyle advice', 'Physical therapy'
    description TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create the SecurityLogs table
CREATE TABLE IF NOT EXISTS "SecurityLogs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL, -- e.g., 'low', 'medium', 'high'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SAMPLE DATA INSERTION GUIDE
-- ─────────────────────────────────────────────────────────────
-- To insert sample data, you need to:
-- 1. Create a patient with a nin_hash (e.g., from patient/page.tsx login)
-- 2. Create a prescription for that patient
-- 3. Then insert medicines, diagnoses, treatments for that prescription
--
-- Example SQL (replace UUIDs and nin_hash with actual values):
/*
-- Create test patient
INSERT INTO "Patients" (nin_hash, public_key, medical_history_encrypted)
VALUES ('123456_hashed', NULL, 'none')
ON CONFLICT (nin_hash) DO NOTHING;

-- Get the patient ID (query this first)
SELECT id FROM "Patients" WHERE nin_hash = '123456_hashed';
-- Copy the patient_id from result above

-- Create test prescription
INSERT INTO "Prescriptions" (patient_id, doctor_id, encrypted_blob, status)
VALUES ('PATIENT_ID_HERE', 'doc_001', 'test_encrypted_blob', 'pending');

-- Get the prescription ID (query this)
SELECT id FROM "Prescriptions" WHERE patient_id = 'PATIENT_ID_HERE' LIMIT 1;
-- Copy the prescription_id from result above

-- Insert sample diagnoses
INSERT INTO "Diagnoses" (prescription_id, patient_id, doctor_id, diagnosis_name, icd_code, notes)
VALUES 
  ('PRESCRIPTION_ID_HERE', 'PATIENT_ID_HERE', 'doc_001', 'Hypertension', 'I10', 'Patient has high blood pressure'),
  ('PRESCRIPTION_ID_HERE', 'PATIENT_ID_HERE', 'doc_001', 'Gastritis', 'K29', 'Inflammation of the stomach lining');

-- Insert sample medicines
INSERT INTO "Medicines" (prescription_id, medicine_name, dosage, frequency, duration, instructions)
VALUES 
  ('PRESCRIPTION_ID_HERE', 'Amlodipine', '5mg', 'Once daily', '30 days', 'Take in the morning with or without food'),
  ('PRESCRIPTION_ID_HERE', 'Lisinopril', '10mg', 'Once daily', '30 days', 'Take in the morning before food'),
  ('PRESCRIPTION_ID_HERE', 'Omeprazole', '20mg', 'Twice daily', '14 days', 'Take 30 minutes before meals'),
  ('PRESCRIPTION_ID_HERE', 'Antacid', '500mg', 'As needed', '30 days', 'Take after meals if needed');

-- Insert sample treatments
INSERT INTO "Treatments" (prescription_id, treatment_type, description, instructions)
VALUES 
  ('PRESCRIPTION_ID_HERE', 'Lifestyle advice', 'Reduce salt intake and exercise regularly', 'Aim for 30 minutes of moderate exercise daily'),
  ('PRESCRIPTION_ID_HERE', 'Dietary changes', 'Avoid spicy and acidic foods', 'Eat smaller, frequent meals');
*/

-- Optional: Add basic Row Level Security (RLS) policies if needed, 
-- or disable RLS for now so the backend service key can bypass it easily.
-- For a backend using service_role key, RLS doesn't block it, but good to ensure:
-- ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Patients" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Prescriptions" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "SecurityLogs" ENABLE ROW LEVEL SECURITY;
