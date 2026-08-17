CREATE TABLE user_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    video_reference VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_user_time ON user_feedbacks(user_id, created_at);
