-- V2__create_refresh_tokens_table.sql

CREATE TABLE refresh_tokens (
                                id BIGSERIAL PRIMARY KEY,
                                user_id UUID NOT NULL,
                                token VARCHAR(255) NOT NULL UNIQUE,
                                expiry_date TIMESTAMP NOT NULL,
                                revoked BOOLEAN DEFAULT FALSE, -- Đánh dấu true khi user đăng xuất
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index để tìm kiếm token nhanh chóng khi user yêu cầu cấp lại Access Token
CREATE INDEX idx_refresh_token ON refresh_tokens(token);