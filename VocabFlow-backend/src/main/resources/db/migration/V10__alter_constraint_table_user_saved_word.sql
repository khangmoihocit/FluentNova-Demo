ALTER TABLE user_saved_words DROP CONSTRAINT IF EXISTS unique_user_word;

ALTER TABLE user_saved_words ADD CONSTRAINT unique_user_word_group UNIQUE (user_id, word_id, group_id);