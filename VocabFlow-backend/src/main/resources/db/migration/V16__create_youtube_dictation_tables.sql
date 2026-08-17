-- ==============================================================================
-- V16: CREATE TABLES FOR YOUTUBE DICTATION & SHADOWING FEATURE (WITH CHANNELS)
-- ==============================================================================

-- 1. Bảng Youtube Channels (Kênh YouTube)
CREATE TABLE youtube_channels (
                                  id BIGSERIAL PRIMARY KEY,
                                  youtube_channel_id VARCHAR(100) UNIQUE, -- ID thật của YouTube
                                  name VARCHAR(255) NOT NULL,
                                  avatar_url TEXT,
                                  description TEXT,
                                  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Video Lessons (Bài học Video)
CREATE TABLE video_lessons (
                               id BIGSERIAL PRIMARY KEY,
                               channel_id BIGINT NOT NULL, -- Khóa ngoại trỏ về Kênh
                               youtube_video_id VARCHAR(50) NOT NULL UNIQUE,
                               title VARCHAR(255) NOT NULL,
                               thumbnail_url TEXT,
                               difficulty_level VARCHAR(20) DEFAULT 'MEDIUM',
                               is_published BOOLEAN DEFAULT FALSE,
                               created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Xóa Kênh thì xóa luôn các Video của kênh đó
                               CONSTRAINT fk_video_channel
                                   FOREIGN KEY (channel_id)
                                       REFERENCES youtube_channels(id)
                                       ON DELETE CASCADE
);

CREATE INDEX idx_video_lessons_channel_id ON video_lessons(channel_id);

-- 3. Bảng Video Segments (Từng câu sub cắt nhỏ)
CREATE TABLE video_segments (
                                id BIGSERIAL PRIMARY KEY,
                                video_id BIGINT NOT NULL,
                                segment_order INT NOT NULL,
                                start_time NUMERIC(8, 2) NOT NULL,
                                end_time NUMERIC(8, 2) NOT NULL,
                                english_text TEXT NOT NULL,
                                vietnamese_translation TEXT,
                                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_segment_video
                                    FOREIGN KEY (video_id)
                                        REFERENCES video_lessons(id)
                                        ON DELETE CASCADE
);

CREATE INDEX idx_video_segments_video_id ON video_segments(video_id);
CREATE INDEX idx_video_segments_order ON video_segments(video_id, segment_order);

-- 4. Bảng Lưu vết học tập (User Attempts)
CREATE TABLE user_segment_attempts (
                                       id BIGSERIAL PRIMARY KEY,
                                       user_id UUID NOT NULL,
                                       segment_id BIGINT NOT NULL,
                                       dictation_user_text TEXT,
                                       dictation_score INTEGER DEFAULT 0,
                                       shadowing_score INTEGER DEFAULT 0,
                                       is_mastered BOOLEAN DEFAULT FALSE,
                                       updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                                       CONSTRAINT fk_attempt_user_segment
                                           FOREIGN KEY (user_id)
                                               REFERENCES users(id)
                                               ON DELETE CASCADE,

                                       CONSTRAINT fk_attempt_segment
                                           FOREIGN KEY (segment_id)
                                               REFERENCES video_segments(id)
                                               ON DELETE CASCADE,

                                       CONSTRAINT uq_user_segment UNIQUE (user_id, segment_id)
);

CREATE INDEX idx_user_segment_attempts_user_id ON user_segment_attempts(user_id);