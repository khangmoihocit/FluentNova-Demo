-- ==============================================================================
-- 1. HỆ THỐNG PHÂN LOẠI VIDEO (CATEGORY SYSTEM)
-- ==============================================================================

CREATE TABLE categories (
                            id BIGSERIAL PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            description TEXT,
                            icon_url VARCHAR(255),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_category_mapping (
                                        video_id BIGSERIAL NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
                                        category_id BIGSERIAL NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                                        PRIMARY KEY (video_id, category_id)
);

-- ==============================================================================
-- 2. HỆ THỐNG KIỂM TRA (VIDEO COMPREHENSION QUIZ)
-- ==============================================================================

CREATE TABLE video_quizzes (
                               id BIGSERIAL PRIMARY KEY,
                               video_id BIGSERIAL NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
                               question_text TEXT NOT NULL,
                               explanation TEXT,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_options (
                              id BIGSERIAL PRIMARY KEY,
                              quiz_id BIGSERIAL NOT NULL REFERENCES video_quizzes(id) ON DELETE CASCADE,
                              option_text TEXT NOT NULL,
                              is_correct BOOLEAN DEFAULT FALSE,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quiz_attempts (
                                    id BIGSERIAL PRIMARY KEY,
                                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                    video_id BIGSERIAL NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
                                    score NUMERIC(5, 2) DEFAULT 0.00,
                                    total_correct INT NOT NULL DEFAULT 0,
                                    total_questions INT NOT NULL DEFAULT 0,
                                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. TỔNG HỢP TIẾN ĐỘ VIDEO (VIDEO TOTAL SCORE & PROGRESS)
-- ==============================================================================

CREATE TABLE user_video_progress (
                                     id BIGSERIAL PRIMARY KEY,
                                     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                     video_id BIGSERIAL NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,

    -- Điểm trung bình
                                     avg_dictation_score NUMERIC(5, 2) DEFAULT 0.00,
                                     avg_shadowing_score NUMERIC(5, 2) DEFAULT 0.00,
                                     completion_percentage NUMERIC(5, 2) DEFAULT 0.00,

    -- Lưu trữ thời gian (giây)
                                     total_learning_time INT DEFAULT 0,
                                     dictation_time_seconds INT DEFAULT 0,
                                     shadowing_time_seconds INT DEFAULT 0,
                                     video_watch_time_seconds INT DEFAULT 0,

                                     status VARCHAR(50) DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED
                                     is_mastered BOOLEAN DEFAULT FALSE,

                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc: Mỗi user chỉ có 1 bản ghi progress cho 1 video
                                     CONSTRAINT uq_user_video_progress UNIQUE (user_id, video_id)
);

-- ==============================================================================
-- 4. THEO DÕI THỜI GIAN VÀ TIẾN ĐỘ HỌC (LEARNING LOGS & STREAK)
-- ==============================================================================

CREATE TABLE study_sessions (
                                id BIGSERIAL PRIMARY KEY,
                                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                video_id BIGSERIAL REFERENCES video_lessons(id) ON DELETE SET NULL,
                                activity_type VARCHAR(50) NOT NULL, -- Ví dụ: 'DICTATION', 'SHADOWING', 'QUIZ', 'WATCH_VIDEO'
                                duration_seconds INT NOT NULL DEFAULT 0,
                                session_date DATE NOT NULL, -- Dùng DATE thay vì TIMESTAMP để dễ nhóm (group by) khi vẽ Heatmap
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Đánh index cho study_sessions để query API lịch học tập (Heatmap) nhanh hơn
CREATE INDEX idx_study_sessions_user_date ON study_sessions(user_id, session_date);

CREATE TABLE user_streaks (
                              user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                              current_streak INT DEFAULT 0,
                              longest_streak INT DEFAULT 0,
                              last_activity_date DATE,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);