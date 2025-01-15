import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import { Link2Icon } from 'lucide-react';
import * as THREE from 'three';

interface Network3DGraphProps {
  notes: Note[];
}

interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  // Handle node click/tap
  const handleNodeClick = useCallback((node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    }
  }, [isMobile, navigate]);

  // Mobile optimization
  useEffect(() => {
    if (graphRef.current && isMobile) {
      // Optimize force simulation for mobile
      const fg = graphRef.current;
      fg.d3Force('charge').strength(-150);
      fg.d3Force('link').distance(60);
      
      // Adjust camera and controls for mobile
      const distance = 200;
      fg.cameraPosition({ z: distance });
      
      // Enable touch-based rotation
      let touchRotationSpeed = 0.5;
      let lastTouchX = 0;
      let lastTouchY = 0;
      
      const handleTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      };
      
      const handleTouchMove = (event: TouchEvent) => {
        const touch = event.touches[0];
        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;
        
        if (fg.camera) {
          fg.camera().position.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -deltaX * touchRotationSpeed / dimensions.width
          );
          fg.camera().position.applyAxisAngle(
            new THREE.Vector3(1, 0, 0),
            -deltaY * touchRotationSpeed / dimensions.height
          );
        }
        
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      };
      
      const elem = fg.renderer().domElement;
      elem.addEventListener('touchstart', handleTouchStart);
      elem.addEventListener('touchmove', handleTouchMove);
      
      return () => {
        elem.removeEventListener('touchstart', handleTouchStart);
        elem.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [isMobile, dimensions]);

  const getLinkColor = (link: NetworkLink) => {
    if (!link.source || !link.target) return theme === 'dark' ? '#475569' : '#94a3b8';
    
    const isUrlLink = 
      (link.source as NetworkNode).originalNote?.input_type === 'url' || 
      (link.target as NetworkNode).originalNote?.input_type === 'url';
    
    return isUrlLink 
      ? theme === 'dark' ? '#60a5fa' : '#3b82f6'
      : theme === 'dark' ? '#475569' : '#94a3b8';
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.type === 'tag') {
      const usageCount = tagUsageCount.get(node.name) ?? 1;
      return colorScale(usageCount);
    }
    
    if (node.type === 'note' && node.originalNote?.input_type === 'url') {
      return theme === 'dark' ? '#60a5fa' : '#3b82f6';
    }
    
    return theme === 'dark' ? '#6366f1' : '#818cf8';
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full touch-pan-y touch-pinch-zoom"
    >
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel={(node: any) => {
          const n = node as NetworkNode;
          if (n.type === 'note' && n.originalNote?.input_type === 'url') {
            return `🔗 ${n.name}`;
          }
          return n.name;
        }}
        nodeColor={getNodeColor}
        linkColor={getLinkColor}
        backgroundColor={theme === 'dark' ? 'hsl(229 19% 12%)' : 'hsl(40 33% 98%)'}
        onNodeClick={handleNodeClick}
        nodeRelSize={6}
        linkWidth={1}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={isMobile}
        controlType="orbit"
        forceEngine={isMobile ? "d3" : undefined}
        cooldownTicks={isMobile ? 50 : undefined}
        warmupTicks={isMobile ? 20 : undefined}
      />
      {selectedNote && (
        <NotePopupWindow
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
};