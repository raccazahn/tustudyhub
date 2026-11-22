-- TuStudyHub Stage 8: Official PDF Stamping and QR Verification
-- Additive migration to support stamped artifact tracking

ALTER TABLE document_verifications
ADD COLUMN IF NOT EXISTS stamped_internal_file_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS stamped_file_hash VARCHAR(64);
