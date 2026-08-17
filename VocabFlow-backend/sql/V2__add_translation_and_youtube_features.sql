-- ==============================================================================
-- 1. CẬP NHẬT TỪ ĐIỂN VÀ SỔ TAY TỪ VỰNG (TỪ V1)
-- ==============================================================================

-- Thêm trường thông tin cho từ điển chung
ALTER TABLE dictionary_words
    ADD COLUMN html_content TEXT,
    ADD COLUMN description TEXT;

-- Tạo bảng Đơn vị bài học (Units) nằm trong các Nhóm từ vựng (Groups)
CREATE TABLE vocabulary_units (
                                  id BIGSERIAL PRIMARY KEY,
                                  group_id BIGINT NOT NULL REFERENCES vocabulary_groups(id) ON DELETE CASCADE,
                                  name VARCHAR(255) NOT NULL, -- Ví dụ: "Unit 1: Đồ ăn", "Week 1"
                                  description TEXT,
                                  order_index INT DEFAULT 0,  -- Dùng để drag & drop, sắp xếp thứ tự
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cập nhật bảng từ vựng đã lưu: Chuyển từ việc lưu theo group_id sang lưu theo unit_id
ALTER TABLE user_saved_words DROP CONSTRAINT IF EXISTS unique_user_word_group;
ALTER TABLE user_saved_words DROP COLUMN group_id;
ALTER TABLE user_saved_words ADD COLUMN unit_id BIGINT REFERENCES vocabulary_units(id) ON DELETE CASCADE;

-- ==============================================================================
-- 2. HỆ THỐNG LUYỆN DỊCH (TRANSLATION PRACTICE)
-- ==============================================================================

CREATE TABLE translation_topics (
                                    id BIGSERIAL PRIMARY KEY,
                                    title VARCHAR(255) NOT NULL,
                                    description TEXT,
                                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE translation_exercises (
                                       id BIGSERIAL PRIMARY KEY,
                                       topic_id BIGINT NOT NULL REFERENCES translation_topics(id) ON DELETE CASCADE,
                                       vietnamese_text TEXT NOT NULL,
                                       standard_english_answer TEXT,
                                       standard_explanation TEXT,
                                       difficulty_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
                                       created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_translation_exercises_topic_id ON translation_exercises(topic_id);

CREATE TABLE user_translation_attempts (
                                           id BIGSERIAL PRIMARY KEY,
                                           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                           exercise_id BIGINT NOT NULL REFERENCES translation_exercises(id) ON DELETE CASCADE,
                                           user_input TEXT NOT NULL,
                                           is_ai_used BOOLEAN DEFAULT FALSE,
                                           is_correct BOOLEAN,
                                           ai_score INTEGER,
                                           ai_feedback TEXT,
                                           ai_better_version TEXT,
                                           submitted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_translation_attempts_user_id ON user_translation_attempts(user_id);
CREATE INDEX idx_user_translation_attempts_exercise_id ON user_translation_attempts(exercise_id);

-- ==============================================================================
-- 3. HỆ THỐNG YOUTUBE DICTATION & SHADOWING
-- ==============================================================================

CREATE TABLE youtube_channels (
                                  id BIGSERIAL PRIMARY KEY,
                                  youtube_channel_id VARCHAR(100) UNIQUE,
                                  name VARCHAR(255) NOT NULL,
                                  avatar_url TEXT,
                                  description TEXT,
                                  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_lessons (
                               id BIGSERIAL PRIMARY KEY,
                               channel_id BIGINT NOT NULL REFERENCES youtube_channels(id) ON DELETE CASCADE,
                               youtube_video_id VARCHAR(50) NOT NULL UNIQUE,
                               title VARCHAR(255) NOT NULL,
                               thumbnail_url TEXT,
                               difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
                               duration VARCHAR(10),
                               views VARCHAR(20),
                               is_published BOOLEAN DEFAULT FALSE,
                               created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_lessons_channel_id ON video_lessons(channel_id);

CREATE TABLE video_segments (
                                id BIGSERIAL PRIMARY KEY,
                                video_id BIGINT NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
                                segment_order INT NOT NULL,
                                start_time NUMERIC(8, 2) NOT NULL,
                                end_time NUMERIC(8, 2) NOT NULL,
                                english_text TEXT NOT NULL,
                                vietnamese_translation TEXT,
                                ipa TEXT,
                                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_segments_video_id ON video_segments(video_id);
CREATE INDEX idx_video_segments_order ON video_segments(video_id, segment_order);

CREATE TABLE user_segment_attempts (
                                       id BIGSERIAL PRIMARY KEY,
                                       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                       segment_id BIGINT NOT NULL REFERENCES video_segments(id) ON DELETE CASCADE,
                                       dictation_user_text TEXT,
                                       shadowing_user_text TEXT,
                                       dictation_score INTEGER DEFAULT 0,
                                       shadowing_score INTEGER DEFAULT 0,
                                       is_mastered BOOLEAN DEFAULT FALSE,
                                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                                       CONSTRAINT uq_user_segment UNIQUE (user_id, segment_id)
);

CREATE INDEX idx_user_segment_attempts_user_id ON user_segment_attempts(user_id);