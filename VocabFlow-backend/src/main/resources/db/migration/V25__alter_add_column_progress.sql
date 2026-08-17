-- Thêm các cột đếm tiến độ chi tiết
ALTER TABLE user_video_progress
    ADD COLUMN completed_dictation_segments INT DEFAULT 0,
    ADD COLUMN completed_shadowing_segments INT DEFAULT 0;

-- Thêm các cờ trạng thái hoàn thành cho từng kỹ năng
ALTER TABLE user_video_progress
    ADD COLUMN is_dictation_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_shadowing_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_quiz_completed BOOLEAN DEFAULT FALSE;

-- Thêm mốc thời gian học gần nhất để phục vụ tính năng "Tiếp tục học" (Sort)
ALTER TABLE user_video_progress
    ADD COLUMN last_studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;