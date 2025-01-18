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
    width: window.innerWidth, 
    height: window.innerHeight - (isMobile ? 80 : 0) // Account for bottom nav on mobile
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = window.innerHeight - (isMobile ? 80 : 0); // Account for bottom nav
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMobile, containerRef]);

  return dimensions;
};