import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import YouTube from 'react-youtube';

const VideoPlayer = forwardRef(({ youtubeVideoId, initialStartTime = 0, autoPlay = false, onTimeUpdate, onPlayingChange, onEnded }, ref) => {
    // Lưu trữ instance của Youtube Player để gọi hàm tua video
    const [player, setPlayer] = useState(null);
    const intervalRef = useRef(null);

    // Bóc tách ID chuẩn 11 ký tự (đề phòng API trả về cả link)
    const safeId = youtubeVideoId ? String(youtubeVideoId).trim() : '';
    let finalId = safeId;
    if (safeId.includes('v=')) {
        finalId = safeId.split('v=')[1].substring(0, 11);
    } else if (safeId.includes('youtu.be/')) {
        finalId = safeId.split('youtu.be/')[1].substring(0, 11);
    }

    // Cung cấp các hàm cho component cha (StudyPage) gọi xuống
    useImperativeHandle(ref, () => ({
        seekTo: (timeInSeconds) => {
            if (player) {
                player.seekTo(timeInSeconds, true);
                // Report time immediately so parent state stays in sync even if paused
                if (onTimeUpdate) onTimeUpdate(timeInSeconds);
            }
        },
        getCurrentTime: () => {
            if (player && player.getCurrentTime) {
                return player.getCurrentTime();
            }
            return 0;
        },
        playVideo: () => {
            if (player && player.playVideo) {
                player.playVideo();
            }
        },
        pauseVideo: () => {
            if (player && player.pauseVideo) {
                player.pauseVideo();
            }
        },
        stopVideo: () => {
            if (player && player.stopVideo) {
                player.stopVideo();
            }
        },
        refreshSize: () => {
            try {
                const iframe = player?.getIframe?.();
                if (iframe) {
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                }
                window.dispatchEvent(new Event('resize'));
            } catch {
                // YouTube iframe may not be ready yet; the next player tick will recover.
            }
        },
        getVolume: () => {
            if (player && player.getVolume) {
                return player.getVolume();
            }
            return 100;
        },
        setVolume: (value) => {
            if (player && player.setVolume) {
                player.setVolume(value);
            }
        },
    }), [player]);

    // Bắt sự kiện khi Iframe Youtube tải xong
    const onReady = (event) => {
        setPlayer(event.target);
    };

    // Khi video bắt đầu chạy: Bật bộ đếm giờ (200ms/lần) để báo cáo thời gian lên Component cha
    const onPlay = () => {
        if (onPlayingChange) onPlayingChange(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
            if (player && onTimeUpdate) {
                const currentTime = await player.getCurrentTime();
                onTimeUpdate(currentTime);
            }
        }, 200);
    };

    // Khi video tạm dừng: Tắt bộ đếm giờ cho nhẹ máy
    const onPause = () => {
        if (onPlayingChange) onPlayingChange(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // Khi video kết thúc
    const onEnd = () => {
        if (onPlayingChange) onPlayingChange(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (onEnded) onEnded();
    };

    // Dọn dẹp rác khi thoát trang
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Cấu hình tham số cho Youtube Player
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: autoPlay ? 1 : 0,
            start: Math.floor(initialStartTime),
            modestbranding: 1, // Ẩn bớt logo Youtube
            rel: 0, // Không hiện video đề xuất của kênh khác khi kết thúc
            fs: 0, // Ẩn nút fullscreen gốc — app sẽ cung cấp nút fullscreen riêng có hỗ trợ phụ đề
            origin: window.location.origin, // Sửa lỗi bảo mật CORS
        },
    };

    return (
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>
            {finalId ? (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <YouTube
                        videoId={finalId}
                        opts={opts}
                        onReady={onReady}
                        onPlay={onPlay}
                        onPause={onPause}
                        onEnd={onEnd}
                        className="yt-player-wrapper"
                        iframeClassName="yt-player-iframe"
                    />
                </div>
            ) : (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff' }}>
                    Đang tải dữ liệu video...
                </div>
            )}
        </div>
    );
});

export default VideoPlayer;
