import privateApi from '../../../services/api/privateApi';

export const studyApi = {
    /**
     * Fetch all segments and video details for learning
     * @param {string|number} videoLessonId 
     * return {
     * "code": "SUCCESS",
    "data": {
        "segments": [
            {
                "id": 3424,
                "segmentOrder": 1,
                "startTime": 2.56,
                "endTime": 4.80,
                "englishText": "Hello! I'm John Russell.",
                "vietnameseTranslation": "Xin chào! Tôi là John Russell.",
                "ipa": "/həˈloʊ! aɪm ʤɑn ˈrʌsəl./",
                "userAttempt": null
            },
            {
                "id": 3425,
                "segmentOrder": 2,
                "startTime": 5.52,
                "endTime": 13.46,
                "englishText": "We continue our technology theme by listening to a clip about content moderation on social media services.",
                "vietnameseTranslation": "Chúng ta tiếp tục chủ đề công nghệ của mình bằng cách nghe một đoạn clip về việc kiểm duyệt nội dung trên các dịch vụ mạng xã hội.",
                "ipa": "/wi kənˈtɪnju ˈaʊər tɛkˈnɑləʤi θim baɪ ˈlɪsənɪŋ tu ə klɪp əˈbaʊt ˈkɑntɛnt ˌmɑdəˈreɪʃən ɑn ˈsoʊʃəl ˈmidiə ˈsɜrvəsəz./",
                "userAttempt": null
            }
        ],
        "videoDetail": {
            "channelName": "VOA Learning English",
            "id": 37,
            "title": "How to Pronounce: Studying pauses and connections",
            "youtubeVideoId": "uuYpEPqCYYs"
        }
    },
    "message": "Tải bài học video thành công!",
    "success": true,
    "timestamp": "2026-04-18T16:50:42.3384086"
     * }
     */
    getStudyDetail: (videoLessonId) => {
        return privateApi.get(`/video-segments/${videoLessonId}/study-detail`);
    },

    /**
     * Fetch user video progress (including historical study time)
     * @param {number|string} videoId 
     */
    getVideoProgress: (videoId) => {
        return privateApi.get(`/progress/video/${videoId}`);
    },


    /**
     * Autosave dictation progress (Realtime Aggregation)
     * @param {number} videoId
     * @param {Array<{segmentId: number, dictationScore: number, dictationUserText?: string}>} segments 
     * @param {number} studyTimeSeconds
     * @returns {{ isDictationCompleted: boolean, completedSegments: number, avgScore: number }}
     */
    autosaveDictation: (videoId, segments, studyTimeSeconds = 0) => {
        return privateApi.post('/progress/dictation/autosave', { videoId, segments, studyTimeSeconds });
    },

    /**
     * Autosave shadowing progress (Realtime Aggregation)
     * @param {number} videoId
     * @param {Array<{segmentId: number, shadowingScore: number, shadowingUserText?: string}>} segments 
     * @param {number} studyTimeSeconds
     * @returns {{ isShadowingCompleted: boolean, completedSegments: number, avgScore: number }}
     */
    autosaveShadowing: (videoId, segments, studyTimeSeconds = 0) => {
        return privateApi.post('/progress/shadowing/autosave', { videoId, segments, studyTimeSeconds });
    },
};
