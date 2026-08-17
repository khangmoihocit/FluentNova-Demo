-- ==============================================================================
-- V15: CREATE TABLES FOR TRANSLATION PRACTICE FEATURE
-- ==============================================================================

-- 1. Bảng translation_topics: Quản lý các chủ đề bài tập
CREATE TABLE translation_topics (
                                    id BIGSERIAL PRIMARY KEY,
                                    title VARCHAR(255) NOT NULL,
                                    description TEXT,
                                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng translation_exercises: Kho lưu trữ đề bài, đáp án và độ khó
CREATE TABLE translation_exercises (
                                       id BIGSERIAL PRIMARY KEY,
                                       topic_id BIGINT NOT NULL,
                                       vietnamese_text TEXT NOT NULL,
                                       standard_english_answer TEXT,
                                       standard_explanation TEXT,
                                       difficulty_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
                                       created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc khóa ngoại: Xóa topic thì xóa luôn các bài tập bên trong
                                       CONSTRAINT fk_exercise_topic
                                           FOREIGN KEY (topic_id)
                                               REFERENCES translation_topics(id)
                                               ON DELETE CASCADE
);

-- Tạo Index để tăng tốc độ truy vấn khi lọc bài tập theo chủ đề
CREATE INDEX idx_translation_exercises_topic_id ON translation_exercises(topic_id);

-- 3. Bảng user_translation_attempts: Lưu lịch sử làm bài và phản hồi của AI
CREATE TABLE user_translation_attempts (
                                           id BIGSERIAL PRIMARY KEY,
                                           user_id UUID NOT NULL,
                                           exercise_id BIGINT NOT NULL,
                                           user_input TEXT NOT NULL,
                                           is_ai_used BOOLEAN DEFAULT FALSE,
                                           is_correct BOOLEAN,
                                           ai_score INTEGER,
                                           ai_feedback TEXT,
                                           ai_better_version TEXT,
                                           submitted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc khóa ngoại nối với bảng users
                                           CONSTRAINT fk_attempt_user
                                               FOREIGN KEY (user_id)
                                                   REFERENCES users(id)
                                                   ON DELETE CASCADE,

    -- Ràng buộc khóa ngoại nối với bảng exercise
                                           CONSTRAINT fk_attempt_exercise
                                               FOREIGN KEY (exercise_id)
                                                   REFERENCES translation_exercises(id)
                                                   ON DELETE CASCADE
);

-- Tạo Index để tối ưu hóa khi lấy lịch sử học tập của 1 user cụ thể
CREATE INDEX idx_user_translation_attempts_user_id ON user_translation_attempts(user_id);
CREATE INDEX idx_user_translation_attempts_exercise_id ON user_translation_attempts(exercise_id);