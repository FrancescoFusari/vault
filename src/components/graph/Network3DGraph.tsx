import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import { Network3DSettingsDialog, Network3DSettings } from './Network3DSettings';

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
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  const [settings, setSettings] = useState<Network3DSettings>({
    nodeSize: 6,
    linkWidth: 1,
    enableNodeDrag: true,
    enableNavigationControls: true,
    showNavInfo: true,
    enablePointerInteraction: true,
    backgroundColor: theme === 'dark' ? 'hsl(229 19% 12%)' : 'hsl(40 33% 98%)'
  });

  const handleSettingChange = (key: keyof Network3DSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
      className="absolute inset-0 w-full h-full"
    >
      <Network3DSettingsDialog
        settings={settings}
        onSettingChange={handleSettingChange}
      />
      <ForceGraph3D
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
        backgroundColor={settings.backgroundColor}
        onNodeClick={handleNodeClick}
        nodeRelSize={settings.nodeSize}
        linkWidth={settings.linkWidth}
        enableNodeDrag={settings.enableNodeDrag}
        enableNavigationControls={settings.enableNavigationControls}
        showNavInfo={settings.showNavInfo}
        enablePointerInteraction={settings.enablePointerInteraction}
        controlType="orbit"
        forceEngine={isMobile ? "d3" : undefined}
        cooldownTime={isMobile ? 3000 : undefined}
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