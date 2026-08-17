-- V27__create_game_hub_schema.sql
-- Game Hub schema: Strictly separated from core learning data.
-- Designed to be extensible for future game types via the 'game_type' discriminator.

CREATE TABLE user_game_sessions (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type   VARCHAR(50)     NOT NULL,          -- e.g. 'DICTATION_CHALLENGE'
    total_questions INT         NOT NULL,
    final_average_score NUMERIC(5,2),
    status      VARCHAR(20)     NOT NULL,          -- IN_PROGRESS | COMPLETED | ABANDONED
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE user_game_dictation_details (
    id                  BIGSERIAL   PRIMARY KEY,
    session_id          BIGINT      NOT NULL REFERENCES user_game_sessions(id) ON DELETE CASCADE,
    segment_id          BIGINT      NOT NULL REFERENCES video_segments(id) ON DELETE CASCADE,
    hint_count          INT         DEFAULT 0,
    replay_count        INT         DEFAULT 0,
    wrong_submit_count  INT         DEFAULT 0,
    segment_score       INT
);

CREATE INDEX idx_game_sessions_user_id ON user_game_sessions(user_id);
CREATE INDEX idx_game_sessions_status  ON user_game_sessions(user_id, status);
CREATE INDEX idx_game_details_session  ON user_game_dictation_details(session_id);
