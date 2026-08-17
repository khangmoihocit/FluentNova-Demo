CREATE TABLE vocabulary_units (
                                  id BIGSERIAL PRIMARY KEY,
                                  group_id INT NOT NULL REFERENCES vocabulary_groups(id) ON DELETE CASCADE,
                                  name VARCHAR(255) NOT NULL, -- Ví dụ: "Unit 1: Đồ ăn", "Week 1"
                                  description TEXT,
                                  order_index INT DEFAULT 0,  -- drag,  sắp xếp thứ tự Unit 1, 2, 3...
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_saved_words
    ADD COLUMN unit_id INT REFERENCES vocabulary_units(id) ON DELETE CASCADE;

ALTER TABLE user_saved_words
DROP COLUMN group_id;