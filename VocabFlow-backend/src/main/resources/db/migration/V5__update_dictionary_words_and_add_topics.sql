-- V4__update_dictionary_words_and_add_topics.sql

ALTER TABLE dictionary_words DROP CONSTRAINT IF EXISTS dictionary_words_word_key;
ALTER TABLE dictionary_words ADD CONSTRAINT unique_word_pos UNIQUE (word, part_of_speech);

CREATE TABLE topics
(
    id          BIGSERIAL PRIMARY KEY,
    topic_name  VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE word_topics
(
    word_id  BIGINT NOT NULL,
    topic_id BIGINT NOT NULL,
    PRIMARY KEY (word_id, topic_id),

    CONSTRAINT fk_wt_word FOREIGN KEY (word_id) REFERENCES dictionary_words (id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
);