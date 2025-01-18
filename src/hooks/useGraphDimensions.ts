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
    width: 0, 
    height: 0
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [containerRef]);

  return dimensions;
};