-- ============================================================================
-- TuStudyHub — Production PostgreSQL Relational Schema
-- Version: 1.0.0
-- Tagline: Learn • Share • Verify
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('VISITOR', 'STUDENT', 'LECTURER', 'MODERATOR', 'ADMINISTRATOR');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'REJECTED');
CREATE TYPE semester_type AS ENUM ('FIRST', 'SECOND');
CREATE TYPE document_category AS ENUM ('LECTURE_NOTE', 'PAST_QUESTION', 'STUDY_GUIDE', 'LAB_MANUAL', 'SYLLABUS', 'OTHER');
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RESTRICTED');
CREATE TYPE access_level AS ENUM ('PUBLIC', 'STUDENT_ONLY');
CREATE TYPE verification_status AS ENUM ('VERIFIED', 'PENDING', 'REJECTED', 'REVOKED');
CREATE TYPE report_category AS ENUM ('WRONG_COURSE', 'CORRUPTED_FILE', 'COPYRIGHT_INFRINGEMENT', 'LOW_QUALITY', 'INCORRECT_METADATA', 'SPAM');
CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE question_type AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE');
CREATE TYPE feedback_category AS ENUM ('PLATFORM', 'COURSE_CONTENT', 'VERIFICATION', 'BUG', 'FEATURE_REQUEST', 'OTHER');
CREATE TYPE feedback_status AS ENUM ('NEW', 'UNDER_REVIEW', 'PLANNED', 'RESOLVED', 'REJECTED');

-- 1. Colleges Table (Highest tier in academic structure)
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Departments Table (Child of College)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES colleges(id) ON DELETE RESTRICT,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(128) NOT NULL,
    iterations INTEGER NOT NULL DEFAULT 220000,
    algorithm VARCHAR(32) NOT NULL DEFAULT 'pbkdf2-sha512',
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    status user_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    requested_role user_role DEFAULT 'STUDENT',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    contributor_bio TEXT,
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Courses Table (Child of Department)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES colleges(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 100 AND level <= 900),
    semester semester_type NOT NULL DEFAULT 'FIRST',
    description TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Lecturer Course Assignments Table (Many-to-Many: Lecturers to Courses)
CREATE TABLE IF NOT EXISTS lecturer_course_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lecturer_id, course_id)
);

-- 6. Academic Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category document_category NOT NULL,
    academic_year VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(128) NOT NULL,
    file_hash CHAR(64) NOT NULL, -- SHA-256 integrity hash
    internal_file_path VARCHAR(512) NOT NULL,
    status document_status NOT NULL DEFAULT 'PENDING',
    access_level access_level NOT NULL DEFAULT 'PUBLIC',
    download_count INTEGER NOT NULL DEFAULT 0,
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Document Verifications & Public Registry Table
CREATE TABLE IF NOT EXISTS document_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    status verification_status NOT NULL DEFAULT 'PENDING',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Document Reviews Table (Peer Reviews)
CREATE TABLE IF NOT EXISTS document_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision VARCHAR(32) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Content Moderation Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason_category report_category NOT NULL,
    details TEXT NOT NULL,
    status report_status NOT NULL DEFAULT 'PENDING',
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER NOT NULL DEFAULT 15,
    pass_percentage INTEGER NOT NULL DEFAULT 70,
    status quiz_status NOT NULL DEFAULT 'DRAFT',
    current_version INTEGER NOT NULL DEFAULT 1,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Quiz Version Snapshots Table (Immutable assessment versioning)
CREATE TABLE IF NOT EXISTS quiz_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    time_limit_minutes INTEGER NOT NULL,
    pass_percentage INTEGER NOT NULL,
    questions JSONB NOT NULL, -- Array of validated questions with choices and key
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, version_number)
);

-- 12. Quiz Attempts Table (Authenticated and Anonymous transfers)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    quiz_version_id UUID NOT NULL REFERENCES quiz_versions(id) ON DELETE RESTRICT,
    quiz_version_number INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    score_percentage INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers_count INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_seconds INTEGER NOT NULL,
    user_answers JSONB NOT NULL
);

-- 13. User Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous Scholar',
    user_role VARCHAR(32) NOT NULL DEFAULT 'VISITOR',
    category feedback_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status feedback_status NOT NULL DEFAULT 'NEW',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Audit Logs Table (Immutable regulatory and security event trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    actor_role VARCHAR(32),
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for High-Traffic Queries
CREATE INDEX IF NOT EXISTS idx_documents_course ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_verification_token ON documents(verification_token);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
