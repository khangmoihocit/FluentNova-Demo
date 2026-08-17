import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Manages independent scroll positions for each route.
 * Saves the scrollY position when leaving a route and restores it when returning.
 * New navigations default to the top (0).
 */
const scrollCache = new Map();

const ScrollRestoration = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Restore position for the new pathname
    const savedPosition = scrollCache.get(pathname) || 0;
    
    // We use a small delay or requestAnimationFrame to ensure the DOM has updated
    // and layout has settled before scrolling.
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({
        top: savedPosition,
        behavior: 'instant', // Immediate jump for "YouTube-like" feel
      });
    }, 0);

    // 2. Continuous scroll listener to keep the cache updated for the current page
    const handleScroll = () => {
      // Only save if we are not in the middle of a route transition
      // (Simplified: we always save the current scrollY for the current path)
      scrollCache.set(pathname, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  return null;
};

export default ScrollRestoration;
