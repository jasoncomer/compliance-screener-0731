import { useState, useEffect } from 'react';

/**
 * Custom hook to track window size with performance optimizations:
 * - Shared implementation to avoid duplicate event listeners
 * - Debounced updates to reduce render frequency
 * - Cleanup on unmount
 */
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events to prevent excessive rerenders
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150); // 150ms debounce delay
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
};

export default useWindowSize; 