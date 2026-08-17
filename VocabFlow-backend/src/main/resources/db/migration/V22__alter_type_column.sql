ALTER TABLE user_saved_words
DROP COLUMN unit_id;

ALTER TABLE user_saved_words
    ADD COLUMN unit_id BIGINT REFERENCES vocabulary_units(id) ON DELETE CASCADE;

ALTER TABLE vocabulary_units
DROP COLUMN group_id;

ALTER TABLE vocabulary_units
    ADD COLUMN group_id BIGINT NOT NULL REFERENCES vocabulary_groups(id) ON DELETE CASCADE;