-- V26__add_hint_and_penalty_metrics_to_segment_attempts.sql
-- Adds penalty tracking columns for the new dictation scoring algorithm.
-- Score = max(0, 100 - max(0, replayCount - 3)*1 - wrongSubmitCount*2 - hintCount*2)

ALTER TABLE user_segment_attempts ADD COLUMN hint_count INT DEFAULT 0;
ALTER TABLE user_segment_attempts ADD COLUMN replay_count INT DEFAULT 0;
ALTER TABLE user_segment_attempts ADD COLUMN wrong_submit_count INT DEFAULT 0;
