-- 008_tu_academic_structure_and_documents.sql
-- Adds William V.S. Tubman University colleges, departments, and document upload support

CREATE TABLE IF NOT EXISTS tu_colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tu_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES tu_colleges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(college_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tu_departments_college ON tu_departments(college_id);

-- Add document upload support to student_verifications
ALTER TABLE student_verifications
  ADD COLUMN IF NOT EXISTS document_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) CHECK (document_type IN ('ID_CARD', 'BILLING_FORM', NULL)),
  ADD COLUMN IF NOT EXISTS academic_status VARCHAR(50);

-- Migrate existing academic_level to academic_status
UPDATE student_verifications
SET academic_status = CASE
  WHEN academic_level = '100' THEN 'Freshman'
  WHEN academic_level = '200' THEN 'Sophomore'
  WHEN academic_level = '300' THEN 'Junior'
  WHEN academic_level = '400' THEN 'Senior'
  WHEN academic_level = '500' THEN 'Senior'
  ELSE academic_level
END
WHERE academic_status IS NULL;

-- Seed William V.S. Tubman University Colleges
INSERT INTO tu_colleges (name) VALUES
  ('College of Engineering and Technology'),
  ('College of Health Sciences'),
  ('College of Business Administration'),
  ('College of Education'),
  ('College of Agriculture and Forestry'),
  ('College of Arts and Social Sciences'),
  ('College of Natural and Applied Sciences')
ON CONFLICT (name) DO NOTHING;

-- Seed Departments for each college
-- College of Engineering and Technology
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Civil Engineering'),
  ('Electrical Engineering'),
  ('Mechanical Engineering'),
  ('Computer Science'),
  ('Information Technology')
) AS d(name) WHERE c.name = 'College of Engineering and Technology'
ON CONFLICT DO NOTHING;

-- College of Health Sciences
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Public Health'),
  ('Nursing'),
  ('Medical Laboratory Sciences'),
  ('Pharmacy')
) AS d(name) WHERE c.name = 'College of Health Sciences'
ON CONFLICT DO NOTHING;

-- College of Business Administration
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Accounting'),
  ('Management'),
  ('Economics'),
  ('Banking and Finance'),
  ('Marketing')
) AS d(name) WHERE c.name = 'College of Business Administration'
ON CONFLICT DO NOTHING;

-- College of Education
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Curriculum and Instruction'),
  ('Educational Administration'),
  ('Guidance and Counseling'),
  ('Physical Education')
) AS d(name) WHERE c.name = 'College of Education'
ON CONFLICT DO NOTHING;

-- College of Agriculture and Forestry
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Agriculture'),
  ('Forestry'),
  ('Agribusiness')
) AS d(name) WHERE c.name = 'College of Agriculture and Forestry'
ON CONFLICT DO NOTHING;

-- College of Arts and Social Sciences
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('English'),
  ('History'),
  ('Political Science'),
  ('Sociology'),
  ('Mass Communication'),
  ('Geography')
) AS d(name) WHERE c.name = 'College of Arts and Social Sciences'
ON CONFLICT DO NOTHING;

-- College of Natural and Applied Sciences
INSERT INTO tu_departments (college_id, name)
SELECT c.id, d.name FROM tu_colleges c CROSS JOIN (VALUES
  ('Biology'),
  ('Chemistry'),
  ('Physics'),
  ('Mathematics'),
  ('Biochemistry')
) AS d(name) WHERE c.name = 'College of Natural and Applied Sciences'
ON CONFLICT DO NOTHING;
