CREATE TABLE user_favorite_videos (
    user_id UUID NOT NULL,
    video_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_favorite_videos PRIMARY KEY (user_id, video_id),
    CONSTRAINT fk_user_favorite_videos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_favorite_videos_video FOREIGN KEY (video_id) REFERENCES video_lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_favorite_videos_user_id ON user_favorite_videos(user_id);
