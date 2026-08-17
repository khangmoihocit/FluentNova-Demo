
CREATE TABLE vocabulary_groups (
                                   id BIGSERIAL PRIMARY KEY,
                                   user_id UUID NOT NULL,
                                   name VARCHAR(255) NOT NULL,
                                   is_default BOOLEAN DEFAULT FALSE, -- Cờ đánh dấu đây là nhóm mặc định hệ thống tự tạo
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   CONSTRAINT fk_vg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Thêm cột group_id vào bảng trung gian lưu từ của user
ALTER TABLE user_saved_words
    ADD COLUMN group_id BIGINT;

-- Tạo khóa ngoại liên kết từ đã lưu với nhóm từ vựng
ALTER TABLE user_saved_words
    ADD CONSTRAINT fk_usw_group
        FOREIGN KEY (group_id) REFERENCES vocabulary_groups(id) ON DELETE CASCADE;

-- Tạo index để tăng tốc độ truy vấn khi hiển thị danh sách từ theo nhóm
CREATE INDEX idx_usw_group_id ON user_saved_words(group_id);
CREATE INDEX idx_vg_user_id ON vocabulary_groups(user_id);