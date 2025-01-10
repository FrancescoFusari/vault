import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const handleNodeClick = (node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
    >
      <ForceGraph3D
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (node.type === 'tag') {
            const usageCount = tagUsageCount.get(node.name) ?? 1;
            return colorScale(usageCount);
          }
          return theme === 'dark' ? '#6366f1' : '#818cf8';
        }}
        linkColor={() => theme === 'dark' ? '#475569' : '#94a3b8'}
        backgroundColor={theme === 'dark' ? 'hsl(229 19% 12%)' : 'hsl(40 33% 98%)'}
        onNodeClick={handleNodeClick}
        nodeRelSize={6}
        linkWidth={1}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={true}
        controlType="orbit"
        // Add touch sensitivity controls
        touchMoveRatio={0.3} // Reduce touch movement sensitivity (default is 1)
        touchRotateRatio={0.3} // Reduce touch rotation sensitivity
        touchZoomRatio={0.2} // Reduce touch zoom sensitivity
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