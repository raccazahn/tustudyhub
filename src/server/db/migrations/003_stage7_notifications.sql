-- ============================================================================
-- TuStudyHub — Stage 7: Persistent Notification System
-- Version: 003_stage7_notifications
-- ============================================================================

-- 1. Notifications Table (Payload)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL means global announcement
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_id UUID, -- Links to document, quiz, etc.
    entity_type VARCHAR(64), -- e.g., 'DOCUMENT', 'QUIZ'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Notification Reads Table (Per-user read status)
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id, read_at);
