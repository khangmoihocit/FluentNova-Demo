import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * useResizer — reusable draggable panel resizer hook.
 *
 * Performs direct DOM manipulation for buttery smooth resizing
 * without React rendering overhead.
 *
 * @param {Object} options
 * @param {string}  options.containerId   — DOM id of the flex container
 * @param {number}  options.defaultPercent — initial panel width % (default 44)
 * @param {number}  options.minPercent     — minimum allowed % (default 20)
 * @param {number}  options.maxPercent     — maximum allowed % (default 60)
 * @returns {{ panelRef, currentWidthRef, isDraggingState, handleMouseDown, setPanelWidth }}
 */
const useResizer = ({
    containerId,
    defaultPercent = 44,
    minPercent = 20,
    maxPercent = 60,
} = {}) => {
    const panelRef = useRef(null);
    const currentWidthRef = useRef(defaultPercent);
    const isDragging = useRef(false);
    const [isDraggingState, setIsDraggingState] = useState(false);

    const setPanelWidth = useCallback((percent, { animate = true } = {}) => {
        let nextWidth = percent;
        if (nextWidth < minPercent) nextWidth = minPercent;
        if (nextWidth > maxPercent) nextWidth = maxPercent;

        currentWidthRef.current = nextWidth;
        if (!panelRef.current) return;

        panelRef.current.style.transition = animate ? 'flex-basis 360ms ease, max-width 360ms ease' : '';
        panelRef.current.style.flex = `0 0 ${nextWidth}%`;
        panelRef.current.style.maxWidth = `${nextWidth}%`;

        if (animate) {
            window.setTimeout(() => {
                if (panelRef.current) panelRef.current.style.transition = '';
            }, 380);
        }
    }, [maxPercent, minPercent]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current) return;
        const container = document.getElementById(containerId);
        if (container) {
            const containerRect = container.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (newWidth < minPercent) newWidth = minPercent;
            if (newWidth > maxPercent) newWidth = maxPercent;

            // Direct DOM manipulation for buttery smooth layout
            if (panelRef.current) {
                panelRef.current.style.flex = `0 0 ${newWidth}%`;
                panelRef.current.style.maxWidth = `${newWidth}%`;
            }
            currentWidthRef.current = newWidth;
        }
    }, [containerId, minPercent, maxPercent]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        setIsDraggingState(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
        setIsDraggingState(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        panelRef,
        currentWidthRef,
        isDraggingState,
        handleMouseDown,
        setPanelWidth,
    };
};

export default useResizer;
