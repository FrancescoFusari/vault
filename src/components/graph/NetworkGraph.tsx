import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { NetworkGraphSettings } from './NetworkGraphSettings';
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [settings, setSettings] = useState({
    linkDistance: 100,
    chargeStrength: -200,
    collisionRadius: 5
  });

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const handleNodeClick = (node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    } else if (node.type === 'tag') {
      // Safely get tag usage count with fallback to 0
      const usageCount = tagUsageCount.get(node.name) ?? 0;
      console.log(`Tag ${node.name} clicked. Usage count: ${usageCount}`);
      
      // Show toast with more detailed information
      toast({
        title: `Tag: ${node.name}`,
        description: `This tag is used in ${usageCount} note${usageCount === 1 ? '' : 's'}`,
        duration: 3000, // Set a specific duration
      });
    }
  };

  const handleSettingChange = (setting: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden"
    >
      <NetworkGraphSettings 
        settings={settings}
        onSettingChange={handleSettingChange}
      />
      <NetworkGraphSimulation
        width={dimensions.width}
        height={dimensions.height}
        nodes={nodes}
        links={links}
        tagUsageCount={tagUsageCount}
        colorScale={colorScale}
        onNodeClick={handleNodeClick}
        settings={settings}
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