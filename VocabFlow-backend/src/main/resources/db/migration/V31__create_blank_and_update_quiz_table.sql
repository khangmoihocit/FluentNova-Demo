-- ==============================================================================
-- VIDEO FILL BLANK: 1 VIDEO = 1 FILL BLANK LESSON
-- ==============================================================================

CREATE TABLE video_fill_blank_items (
                                        id BIGSERIAL PRIMARY KEY,

                                        video_id BIGINT NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
                                        segment_id BIGINT NOT NULL REFERENCES video_segments(id) ON DELETE CASCADE,

                                        blank_order INT NOT NULL,

                                        answer_text TEXT NOT NULL,
                                        accepted_answers JSONB,

                                        start_char_index INT,
                                        end_char_index INT,
                                        token_index INT,

                                        blank_type VARCHAR(50) DEFAULT 'WORD',
                                        hint TEXT,
                                        difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
                                        points INT DEFAULT 1,

                                        is_active BOOLEAN DEFAULT TRUE,

                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                        CONSTRAINT uq_video_fill_blank_order UNIQUE (video_id, blank_order)
);

CREATE INDEX idx_video_fill_blank_items_video_id
    ON video_fill_blank_items(video_id);

CREATE INDEX idx_video_fill_blank_items_segment_id
    ON video_fill_blank_items(segment_id);

-- ==============================================================================
-- USER FILL BLANK ATTEMPTS
-- ==============================================================================

CREATE TABLE user_fill_blank_attempts (
                                          id BIGSERIAL PRIMARY KEY,

                                          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                          video_id BIGINT NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,

                                          score NUMERIC(5, 2) DEFAULT 0.00,
                                          total_blanks INT NOT NULL DEFAULT 0,
                                          total_correct INT NOT NULL DEFAULT 0,

                                          status VARCHAR(50) DEFAULT 'COMPLETED',

                                          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_fill_blank_attempts_user_id
    ON user_fill_blank_attempts(user_id);

CREATE INDEX idx_user_fill_blank_attempts_video_id
    ON user_fill_blank_attempts(video_id);

CREATE TABLE user_fill_blank_answers (
                                         id BIGSERIAL PRIMARY KEY,

                                         attempt_id BIGINT NOT NULL REFERENCES user_fill_blank_attempts(id) ON DELETE CASCADE,
                                         blank_item_id BIGINT NOT NULL REFERENCES video_fill_blank_items(id) ON DELETE CASCADE,

                                         user_answer TEXT,
                                         normalized_user_answer TEXT,
                                         is_correct BOOLEAN DEFAULT FALSE,

                                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                         CONSTRAINT uq_user_fill_blank_answer UNIQUE (attempt_id, blank_item_id)
);

CREATE INDEX idx_user_fill_blank_answers_attempt_id
    ON user_fill_blank_answers(attempt_id);

CREATE INDEX idx_user_fill_blank_answers_blank_item_id
    ON user_fill_blank_answers(blank_item_id);

-- ==============================================================================
-- QUIZ UPGRADE
-- ==============================================================================

ALTER TABLE video_quizzes
    ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'MULTIPLE_CHOICE',
    ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

ALTER TABLE quiz_options
    ADD COLUMN IF NOT EXISTS option_order INT DEFAULT 0;

ALTER TABLE user_quiz_attempts
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE user_quiz_answers (
                                   id BIGSERIAL PRIMARY KEY,

                                   attempt_id BIGINT NOT NULL REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
                                   quiz_id BIGINT NOT NULL REFERENCES video_quizzes(id) ON DELETE CASCADE,
                                   selected_option_id BIGINT REFERENCES quiz_options(id) ON DELETE SET NULL,

                                   user_answer_text TEXT,

                                   is_correct BOOLEAN DEFAULT FALSE,

                                   answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                   CONSTRAINT uq_user_quiz_answer UNIQUE (attempt_id, quiz_id)
);

CREATE INDEX idx_user_quiz_answers_attempt_id
    ON user_quiz_answers(attempt_id);

CREATE INDEX idx_user_quiz_answers_quiz_id
    ON user_quiz_answers(quiz_id);

-- ==============================================================================
-- PROGRESS UPGRADE
-- ==============================================================================

ALTER TABLE user_video_progress
    ADD COLUMN IF NOT EXISTS avg_fill_blank_score NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS avg_quiz_score NUMERIC(5, 2) DEFAULT 0.00,

    ADD COLUMN IF NOT EXISTS fill_blank_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE,

    ADD COLUMN IF NOT EXISTS fill_blank_time_seconds INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_time_seconds INT DEFAULT 0,

    ADD COLUMN IF NOT EXISTS last_activity_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;