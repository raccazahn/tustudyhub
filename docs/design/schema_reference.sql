-- schema_reference.sql  (DRAFT, for team review)
-- Reference schema for docs/design/DATA_MODEL.md. NOT an applied migration.
-- The technology stack is not yet approved (SDD section 4 recommends
-- SQLAlchemy + Alembic). If Alembic is adopted, translate this into Alembic
-- revisions instead of running it directly.
-- Target: PostgreSQL 13+ (gen_random_uuid() is built in; generated columns need 12+).
-- Scope: baseline = mandatory items in REQUIREMENTS.md section 1.1 only.
-- Optional items (section 1.2) are intentionally NOT created here.

BEGIN;

-- =====================================================================
-- Identity and access (FR-001 to FR-010, FR-036, FR-055)
-- =====================================================================
CREATE TABLE roles (
    id   SMALLINT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    email_verified_at    TIMESTAMPTZ,
    password_hash        TEXT NOT NULL,
    display_name         TEXT NOT NULL,
    role_id              SMALLINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'active', 'suspended', 'deactivated')),
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users (role_id);

CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id);

-- Conditional: needed only if the approved auth design uses server-side refresh tokens.
CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE account_deletion_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
    decided_at      TIMESTAMPTZ,
    decision_reason TEXT,
    CHECK (
        (status = 'pending' AND decided_by IS NULL AND decided_at IS NULL)
        OR (status <> 'pending' AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
    ),
    CHECK (status <> 'rejected' OR (decision_reason IS NOT NULL AND btrim(decision_reason) <> ''))
);
CREATE UNIQUE INDEX uq_deletion_one_pending ON account_deletion_requests (user_id) WHERE status = 'pending';
CREATE INDEX idx_deletion_requests_user ON account_deletion_requests (user_id);

CREATE TABLE contributor_applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    statement       TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
    decided_at      TIMESTAMPTZ,
    decision_reason TEXT,
    CHECK (decided_by IS NULL OR decided_by <> applicant_id),
    CHECK (
        (status = 'pending' AND decided_by IS NULL AND decided_at IS NULL AND decision_reason IS NULL)
        OR (status = 'approved' AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
        OR (status = 'rejected' AND decided_by IS NOT NULL AND decided_at IS NOT NULL
            AND decision_reason IS NOT NULL AND btrim(decision_reason) <> '')
    )
);
CREATE UNIQUE INDEX uq_contributor_one_pending ON contributor_applications (applicant_id) WHERE status = 'pending';
CREATE INDEX idx_contributor_applications_applicant ON contributor_applications (applicant_id);

-- =====================================================================
-- Course catalogue (FR-011 to FR-014) and lecturer course scope (FR-030)
-- =====================================================================
CREATE TABLE courses (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code       TEXT NOT NULL,
    title      TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_courses_code_ci ON courses (upper(code));

CREATE TABLE course_lecturers (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    PRIMARY KEY (course_id, user_id)
);
CREATE INDEX idx_course_lecturers_user ON course_lecturers (user_id);

-- =====================================================================
-- Document library (FR-015 to FR-021, FR-027)
-- =====================================================================
CREATE TABLE document_categories (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE papers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id           TEXT UNIQUE,   -- stable public identifier, assigned on first approval (FR-046)
    uploader_id         UUID NOT NULL REFERENCES users(id)               ON DELETE RESTRICT,
    course_id           UUID NOT NULL REFERENCES courses(id)             ON DELETE RESTRICT,
    category_id         UUID NOT NULL REFERENCES document_categories(id) ON DELETE RESTRICT,
    title               TEXT NOT NULL,
    year                SMALLINT NOT NULL CHECK (year BETWEEN 1900 AND 2100),
    semester            TEXT,          -- when relevant (FR-017)
    exam_type           TEXT,          -- when relevant (FR-017)
    lecturer_name       TEXT,          -- optional (FR-017)
    status              TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected',
                                          'restricted', 'removed', 'revoked')),
    is_publicly_visible BOOLEAN NOT NULL DEFAULT FALSE,  -- distribution/indexing permission (FR-067); policy pending
    search_vector       TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', title)) STORED,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status <> 'approved' OR public_id IS NOT NULL)
);
CREATE INDEX idx_papers_course_status ON papers (course_id, status);
CREATE INDEX idx_papers_uploader      ON papers (uploader_id);
CREATE INDEX idx_papers_category      ON papers (category_id);
CREATE INDEX idx_papers_year          ON papers (year);
CREATE INDEX idx_papers_status_created ON papers (status, created_at);
CREATE INDEX idx_papers_search        ON papers USING GIN (search_vector);

CREATE TABLE paper_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id    UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    sort_order  INT  NOT NULL DEFAULT 1 CHECK (sort_order > 0),
    storage_key TEXT NOT NULL UNIQUE,   -- server-generated name; never the client filename
    mime_type   TEXT NOT NULL,
    size_bytes  BIGINT NOT NULL CHECK (size_bytes > 0),
    sha256      TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (paper_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================================
-- Review, moderation and verification (FR-028 to FR-034, FR-046 to FR-052)
-- =====================================================================
CREATE TABLE paper_decisions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id    UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    actor_id    UUID NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
    action      TEXT NOT NULL
                CHECK (action IN ('submit', 'start_review', 'approve', 'reject', 'resubmit',
                                  'restrict', 'remove', 'restore', 'revoke')),
    from_status TEXT CHECK (from_status IN ('submitted', 'under_review', 'approved', 'rejected',
                                            'restricted', 'removed', 'revoked')),
    to_status   TEXT NOT NULL
                CHECK (to_status IN ('submitted', 'under_review', 'approved', 'rejected',
                                     'restricted', 'removed', 'revoked')),
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        action IN ('submit', 'start_review', 'approve', 'resubmit')
        OR (reason IS NOT NULL AND btrim(reason) <> '')
    )
);
CREATE INDEX idx_paper_decisions_paper ON paper_decisions (paper_id, created_at);
CREATE INDEX idx_paper_decisions_actor ON paper_decisions (actor_id);

CREATE TABLE verifications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id         UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    token_hash       TEXT NOT NULL UNIQUE,   -- hash of the QR token; plain token never stored
    status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    approved_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approver_role_id SMALLINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    approved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_by       UUID REFERENCES users(id) ON DELETE RESTRICT,
    revoked_at       TIMESTAMPTZ,
    revoke_reason    TEXT,
    CHECK (
        (status = 'active' AND revoked_by IS NULL AND revoked_at IS NULL AND revoke_reason IS NULL)
        OR (status = 'revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL
            AND revoke_reason IS NOT NULL AND btrim(revoke_reason) <> '')
    )
);
CREATE UNIQUE INDEX uq_verifications_one_active ON verifications (paper_id) WHERE status = 'active';
CREATE INDEX idx_verifications_paper ON verifications (paper_id);

CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id        UUID NOT NULL REFERENCES papers(id) ON DELETE RESTRICT,
    reporter_id     UUID NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
    report_type     TEXT NOT NULL CHECK (report_type IN ('incorrect', 'prohibited', 'infringing', 'other')),
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
    handled_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
    handled_at      TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status NOT IN ('resolved', 'dismissed') OR (handled_by IS NOT NULL AND handled_at IS NOT NULL))
);
CREATE INDEX idx_reports_paper         ON reports (paper_id);
CREATE INDEX idx_reports_status_created ON reports (status, created_at);
CREATE INDEX idx_reports_reporter      ON reports (reporter_id);

-- =====================================================================
-- Quizzes (FR-037 to FR-045)
-- =====================================================================
CREATE TABLE quizzes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quizzes_course ON quizzes (course_id);

CREATE TABLE quiz_versions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    version_number INT  NOT NULL CHECK (version_number > 0),
    title          TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'in_review', 'published', 'rejected', 'superseded')),
    created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by    UUID REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_at    TIMESTAMPTZ,
    review_reason  TEXT,
    published_at   TIMESTAMPTZ,
    UNIQUE (quiz_id, version_number),
    CHECK (reviewed_by IS NULL OR reviewed_by <> created_by),   -- authors cannot review their own quiz
    CHECK (status NOT IN ('published', 'superseded')
           OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND published_at IS NOT NULL)),
    CHECK (status <> 'rejected'
           OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
               AND review_reason IS NOT NULL AND btrim(review_reason) <> ''))
);
CREATE UNIQUE INDEX uq_quiz_one_published ON quiz_versions (quiz_id) WHERE status = 'published';

CREATE TABLE quiz_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_version_id UUID NOT NULL REFERENCES quiz_versions(id) ON DELETE CASCADE,
    position        INT  NOT NULL CHECK (position > 0),
    body            TEXT NOT NULL,
    UNIQUE (quiz_version_id, position) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE (id, quiz_version_id)
);

CREATE TABLE quiz_choices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    position    INT  NOT NULL CHECK (position > 0),
    body        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,   -- answer key: never expose before the permitted stage
    UNIQUE (question_id, position) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE (id, question_id)
);

CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_version_id UUID NOT NULL REFERENCES quiz_versions(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES users(id)         ON DELETE RESTRICT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at    TIMESTAMPTZ,
    score           INT,
    max_score       INT,
    UNIQUE (id, quiz_version_id),
    CHECK (submitted_at IS NULL OR submitted_at >= started_at),
    CHECK (score IS NULL OR (score >= 0 AND max_score IS NOT NULL AND score <= max_score))
);
CREATE INDEX idx_quiz_attempts_user    ON quiz_attempts (user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_version ON quiz_attempts (quiz_version_id);

-- quiz_version_id is repeated here on purpose: the composite foreign keys below
-- guarantee the attempt, the question and the chosen option all belong to the same quiz version.
CREATE TABLE attempt_answers (
    attempt_id      UUID NOT NULL,
    question_id     UUID NOT NULL,
    quiz_version_id UUID NOT NULL,
    choice_id       UUID NOT NULL,
    PRIMARY KEY (attempt_id, question_id),
    FOREIGN KEY (attempt_id, quiz_version_id)
        REFERENCES quiz_attempts (id, quiz_version_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id, quiz_version_id)
        REFERENCES quiz_questions (id, quiz_version_id) ON DELETE RESTRICT,
    FOREIGN KEY (choice_id, question_id)
        REFERENCES quiz_choices (id, question_id) ON DELETE RESTRICT
);
CREATE INDEX idx_attempt_answers_choice ON attempt_answers (choice_id);

-- =====================================================================
-- Audit (FR-052, FR-070, FR-071)
-- Recommended: grant the application role INSERT and SELECT only on this table.
-- =====================================================================
CREATE TABLE audit_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    UUID REFERENCES users(id) ON DELETE RESTRICT,   -- NULL for system events
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT,
    outcome     TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'denied', 'failed')),
    reason      TEXT,
    details     JSONB,   -- must never contain passwords, tokens or file contents
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity  ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_actor   ON audit_log (actor_id);
CREATE INDEX idx_audit_created ON audit_log (created_at);

-- =====================================================================
-- Seed data (role names and categories come from REQUIREMENTS.md; confirm)
-- =====================================================================
INSERT INTO roles (id, name) VALUES
    (1, 'student'),
    (2, 'verified_contributor'),
    (3, 'lecturer'),
    (4, 'moderator'),
    (5, 'administrator');

INSERT INTO document_categories (name) VALUES
    ('Examination paper'),
    ('Thesis paper'),
    ('Syllabus');

COMMIT;
