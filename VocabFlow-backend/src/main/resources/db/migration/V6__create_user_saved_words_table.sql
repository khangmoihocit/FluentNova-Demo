-- V5__create_user_saved_words_table.sql

CREATE TABLE user_saved_words
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID   NOT NULL,
    word_id          BIGINT NOT NULL,
    context_sentence TEXT, -- Câu tiếng Anh chứa từ vựng mà user đã bôi đen
    source_url       TEXT, -- Link website nơi user tra từ

    -- Quản lý trạng thái đồng bộ Anki (PENDING, SYNCED, FAILED)
    anki_status      VARCHAR(50) DEFAULT 'PENDING',

    -- ID của thẻ Anki sau khi đồng bộ thành công (để sau này có thể xóa/sửa thẻ từ web)
    anki_note_id     BIGINT,

    created_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usw_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_usw_word FOREIGN KEY (word_id) REFERENCES dictionary_words (id) ON DELETE CASCADE,

    -- Ràng buộc chống trùng lặp: Một user không thể lưu cùng một từ (cùng từ loại) nhiều lần vào sổ tay
    CONSTRAINT unique_user_word UNIQUE (user_id, word_id)
);

CREATE INDEX idx_user_saved_words_user_id ON user_saved_words (user_id);