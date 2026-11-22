-- 007_student_verification.sql
CREATE TABLE IF NOT EXISTS student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  college VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  academic_programme VARCHAR(100) NOT NULL,
  academic_level VARCHAR(50) NOT NULL,
  institutional_email VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'PENDING',
  admin_review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_student_id UNIQUE (student_id),
  CONSTRAINT valid_status CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUESTED'))
);
CREATE INDEX IF NOT EXISTS idx_sv_user ON student_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sv_status ON student_verifications(verification_status);
