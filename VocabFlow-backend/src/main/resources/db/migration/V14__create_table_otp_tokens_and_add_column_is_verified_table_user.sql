
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

CREATE TABLE otp_tokens (
                           id BIGSERIAL PRIMARY KEY,
                           email VARCHAR(255) NOT NULL,
                           otp_code VARCHAR(6) NOT NULL,
                           expires_at TIMESTAMP NOT NULL,
                           type VARCHAR(20) NOT NULL -- Phân biệt: 'REGISTER' hoặc 'FORGOT_PASSWORD'
);