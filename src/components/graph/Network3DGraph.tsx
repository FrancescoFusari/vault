import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import { Network3DSettingsDialog } from './Network3DSettings';
import { useGraphSettings } from './hooks/useGraphSettings';
import { getNodeColor, getLinkColor } from './utils/colorUtils';
import { NetworkNode } from './types';

interface Network3DGraphProps {
  notes: Note[];
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const highlightedNodeRef = useRef<NetworkNode | null>(null);
  
  const { settings, updateSettings } = useGraphSettings(isMobile);
  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  const handleNodeDragEnd = (node: NetworkNode) => {
    if (settings.enableNodeFixing) {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    highlightedNodeRef.current = node;
    if (graphRef.current) {
      graphRef.current.refresh();
    }
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    const newPos = node.x || node.y || node.z
      ? { 
          x: (node.x || 0) * distRatio, 
          y: (node.y || 0) * distRatio, 
          z: (node.z || 0) * distRatio 
        }
      : { x: 0, y: 0, z: distance };

    graphRef.current.cameraPosition(
      newPos,
      node,
      3000
    );

    setTimeout(() => {
      if (node.type === 'note' && node.originalNote) {
        if (isMobile) {
          setSelectedNote(node.originalNote);
        } else {
          navigate(`/note/${node.originalNote.id}`);
        }
      }
    }, 3000);
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
    >
      <Network3DSettingsDialog
        settings={settings}
        onSettingChange={(key, value) => updateSettings({ ...settings, [key]: value })}
      />
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
        nodeColor={(node: any) => getNodeColor(node as NetworkNode, highlightedNodeRef.current, tagUsageCount, colorScale, theme)}
        linkColor={(link: any) => getLinkColor(link, highlightedNodeRef.current, theme)}
        backgroundColor={settings.backgroundColor}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={handleNodeDragEnd}
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
        d3Force="link"
        d3ForceConfig={{
          link: {
            distance: settings.linkDistance
          }
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