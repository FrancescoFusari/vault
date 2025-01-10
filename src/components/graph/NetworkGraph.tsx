import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { NotePopupWindow } from './NotePopupWindow';
import { NetworkGraphSimulation } from './NetworkGraphSimulation';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';

interface NetworkGraphProps {
  notes: Note[];
}

export const NetworkGraph = ({ notes }: NetworkGraphProps) => {
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
      className="absolute inset-0 overflow-hidden"
    >
      <NetworkGraphSimulation
        width={dimensions.width}
        height={dimensions.height}
        nodes={nodes}
        links={links}
        tagUsageCount={tagUsageCount}
        colorScale={colorScale}
        onNodeClick={handleNodeClick}
        settings={{
          linkDistance: 100,
          chargeStrength: -200,
          collisionRadius: 5
        }}
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