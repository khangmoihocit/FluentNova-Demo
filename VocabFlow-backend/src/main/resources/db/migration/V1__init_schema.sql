-- V1__init_schema.sql

-- Bảng lưu thông tin người dùng
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(255),
                       role VARCHAR(50) DEFAULT 'USER',
                       anki_deck_name VARCHAR(100),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng kho từ điển chung (Global Cache)
CREATE TABLE dictionary_words (
                                  id BIGSERIAL PRIMARY KEY,
                                  word VARCHAR(255) NOT NULL UNIQUE,
                                  part_of_speech VARCHAR(100),
                                  pronunciation VARCHAR(255),
                                  meaning_vi TEXT,
                                  explanation_en TEXT,
                                  audio_url VARCHAR(500),
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index để tìm kiếm từ vựng siêu tốc
CREATE INDEX idx_dictionary_word ON dictionary_words(word);