package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface YoutubeChannelRepository extends JpaRepository<YoutubeChannel, Long>, JpaSpecificationExecutor<YoutubeChannel> {
}
