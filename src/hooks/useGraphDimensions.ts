import { useState, useEffect, RefObject } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export const useGraphDimensions = (
  containerRef: RefObject<HTMLDivElement>,
  isMobile: boolean
): Dimensions => {
  const [dimensions, setDimensions] = useState<Dimensions>({ 
    width: 800, 
    height: isMobile ? window.innerHeight * 0.6 : 600 // Adjust height based on screen size
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = isMobile 
          ? Math.min(window.innerHeight * 0.6, 500) // Cap mobile height
          : Math.min(window.innerHeight * 0.7, 600); // Cap desktop height
        
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMobile, containerRef]);

  return dimensions;
};