import React, { useEffect, useRef } from 'react';

/**
 * TimeListener (FluentNova Performance Component)
 * 
 * An invisible component that listens to currentTime updates.
 * This isolates the high-frequency re-renders (every frame/second)
 * from the heavy UI panels (Dictation/Shadowing/GameEngine).
 * 
 * Logic:
 * 1. Auto-pause video when it reaches the end of the current segment.
 * 2. Syncing other time-sensitive but non-UI-critical side effects.
 */
const TimeListener = ({ 
    currentTime, 
    currentSegment, 
    isPlaying, 
    videoRef, 
    isActive,
    onSegmentEnd,
    autoPause = true
}) => {
    const justSeekedRef = useRef(false);

    // Monitor currentTime for auto-pause logic
    useEffect(() => {
        if (!isActive || !autoPause || !currentSegment || !videoRef?.current || !isPlaying) return;
        
        // Use a small buffer (0.1s) to ensure the pause happens cleanly
        const endTime = currentSegment.endTime;
        
        if (currentTime >= endTime && !justSeekedRef.current) {
            videoRef.current.pauseVideo();
            if (onSegmentEnd) onSegmentEnd();
        }
    }, [currentTime, currentSegment, isPlaying, videoRef, isActive, autoPause, onSegmentEnd]);

    // Track seeking to prevent immediate pause triggers
    useEffect(() => {
        justSeekedRef.current = true;
        const timer = setTimeout(() => {
            justSeekedRef.current = false;
        }, 800);
        return () => clearTimeout(timer);
    }, [currentSegment?.id]);

    return null; // Invisible component
};

export default React.memo(TimeListener);
