-- 1. Enable UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the Users table
CREATE TABLE "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nin_hash TEXT UNIQUE NOT NULL,
    phone_hash TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    encrypted_profile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the Patients table
CREATE TABLE "Patients" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nin_hash TEXT UNIQUE NOT NULL,
    public_key TEXT,
    medical_history_encrypted TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create the Prescriptions table
CREATE TABLE "Prescriptions" (
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

-- 5. Create the SecurityLogs table
CREATE TABLE "SecurityLogs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL, -- e.g., 'low', 'medium', 'high'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add basic Row Level Security (RLS) policies if needed, 
-- or disable RLS for now so the backend service key can bypass it easily.
-- For a backend using service_role key, RLS doesn't block it, but good to ensure:
-- ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Patients" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Prescriptions" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "SecurityLogs" ENABLE ROW LEVEL SECURITY;
