-- ==============================================================================
-- 1. BẢNG ĐỘC LẬP (Không phụ thuộc vào bảng khác)
-- ==============================================================================

-- Bảng lưu thông tin người dùng
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(255),
                       role VARCHAR(50) DEFAULT 'USER',
                       avatar_url VARCHAR(255),
                       provider VARCHAR(50) DEFAULT 'LOCAL',
                       provider_id VARCHAR(255),
                       anki_deck_name VARCHAR(100),
                       is_active BOOLEAN DEFAULT TRUE,
                       is_deleted BOOLEAN DEFAULT FALSE,
                       is_verified BOOLEAN DEFAULT FALSE,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng kho từ điển chung (Global Cache)
CREATE TABLE dictionary_words (
                                  id BIGSERIAL PRIMARY KEY,
                                  word TEXT NOT NULL,
                                  part_of_speech VARCHAR(100),
                                  pronunciation TEXT,
                                  meaning_vi TEXT,
                                  explanation_en TEXT,
                                  explanation_vi TEXT,
                                  example_sentence TEXT,
                                  audio_url VARCHAR(500),
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc: Một từ có thể có nhiều từ loại (vd: book(n), book(v))
                                  CONSTRAINT unique_word_pos UNIQUE (word, part_of_speech)
);

-- Tạo Index để tìm kiếm từ vựng siêu tốc
CREATE INDEX idx_dictionary_word ON dictionary_words(word);

-- Bảng lưu chủ đề (Topics)
CREATE TABLE topics (
                        id BIGSERIAL PRIMARY KEY,
                        topic_name VARCHAR(255) NOT NULL UNIQUE,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu OTP
CREATE TABLE otp_tokens (
                            id BIGSERIAL PRIMARY KEY,
                            email VARCHAR(255) NOT NULL,
                            otp_code VARCHAR(6) NOT NULL,
                            expires_at TIMESTAMP NOT NULL,
                            type VARCHAR(20) NOT NULL -- Phân biệt: 'REGISTER' hoặc 'FORGOT_PASSWORD'
);

-- ==============================================================================
-- 2. BẢNG PHỤ THUỘC BẬC 1 (Phụ thuộc vào 1 bảng khác)
-- ==============================================================================

-- Bảng Refresh Tokens
CREATE TABLE refresh_tokens (
                                id BIGSERIAL PRIMARY KEY,
                                user_id UUID NOT NULL,
                                token TEXT NOT NULL UNIQUE,
                                expiry_date TIMESTAMP NOT NULL,
                                revoked BOOLEAN DEFAULT FALSE, -- Đánh dấu true khi user đăng xuất
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index để tìm kiếm token nhanh chóng khi user yêu cầu cấp lại Access Token
CREATE INDEX idx_refresh_token ON refresh_tokens(token);

-- Bảng Nhóm từ vựng (Sổ tay cá nhân của user)
CREATE TABLE vocabulary_groups (
                                   id BIGSERIAL PRIMARY KEY,
                                   user_id UUID NOT NULL,
                                   name VARCHAR(255) NOT NULL,
                                   is_default BOOLEAN DEFAULT FALSE, -- Cờ đánh dấu đây là nhóm mặc định hệ thống tự tạo
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   CONSTRAINT fk_vg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_vg_user_id ON vocabulary_groups(user_id);

-- ==============================================================================
-- 3. BẢNG TRUNG GIAN N-N (Phụ thuộc vào nhiều bảng)
-- ==============================================================================

-- Bảng map giữa Từ vựng và Chủ đề
CREATE TABLE word_topics (
                             word_id BIGINT NOT NULL,
                             topic_id BIGINT NOT NULL,
                             PRIMARY KEY (word_id, topic_id),
                             CONSTRAINT fk_wt_word FOREIGN KEY (word_id) REFERENCES dictionary_words (id) ON DELETE CASCADE,
                             CONSTRAINT fk_wt_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
);

-- Bảng từ vựng đã lưu của người dùng
CREATE TABLE user_saved_words (
                                  id BIGSERIAL PRIMARY KEY,
                                  user_id UUID NOT NULL,
                                  word_id BIGINT NOT NULL,
                                  group_id BIGINT,
                                  context_sentence TEXT, -- Câu tiếng Anh chứa từ vựng mà user đã bôi đen
                                  source_url TEXT, -- Link website nơi user tra từ

    -- Quản lý trạng thái đồng bộ Anki (PENDING, SYNCED, FAILED)
                                  anki_status VARCHAR(50) DEFAULT 'PENDING',
    -- ID của thẻ Anki sau khi đồng bộ thành công (để sau này có thể xóa/sửa thẻ từ web)
                                  anki_note_id BIGINT,

                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT fk_usw_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                                  CONSTRAINT fk_usw_word FOREIGN KEY (word_id) REFERENCES dictionary_words (id) ON DELETE CASCADE,
                                  CONSTRAINT fk_usw_group FOREIGN KEY (group_id) REFERENCES vocabulary_groups(id) ON DELETE CASCADE,

    -- Ràng buộc chống trùng lặp: Một user không thể lưu cùng một từ (cùng từ loại) nhiều lần vào cùng một nhóm
                                  CONSTRAINT unique_user_word_group UNIQUE (user_id, word_id, group_id)
);

CREATE INDEX idx_user_saved_words_user_id ON user_saved_words (user_id);
CREATE INDEX idx_usw_group_id ON user_saved_words(group_id);