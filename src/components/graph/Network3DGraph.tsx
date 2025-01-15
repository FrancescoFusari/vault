import { useState, useRef, useEffect } from 'react';
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
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const highlightedNodeRef = useRef<NetworkNode | null>(null);
  
  const [settings, setSettings] = useState<Network3DSettings>({
    nodeSize: 6,
    linkWidth: 1,
    enableNodeDrag: true,
    enableNavigationControls: true,
    showNavInfo: true,
    enablePointerInteraction: true,
    backgroundColor: theme === 'dark' ? 'hsl(229 19% 12%)' : 'hsl(40 33% 98%)',
    enableNodeFixing: true,
    enableCurvedLinks: true
  });

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  // Add performance monitoring
  useEffect(() => {
    console.log('Graph Data Stats:', {
      nodeCount: nodes.length,
      linkCount: links.length,
      isMobile,
      curvedLinksEnabled: settings.enableCurvedLinks
    });
  }, [nodes.length, links.length, isMobile, settings.enableCurvedLinks]);

  const handleSettingChange = (key: keyof Network3DSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
    
    // Calculate the distance based on the node's position
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    const newPos = node.x || node.y || node.z
      ? { 
          x: (node.x || 0) * distRatio, 
          y: (node.y || 0) * distRatio, 
          z: (node.z || 0) * distRatio 
        }
      : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

    // Animate camera position
    graphRef.current.cameraPosition(
      newPos,           // New position
      node,            // Look at this node
      3000            // Animation duration in milliseconds
    );

    // Handle navigation after camera movement
    setTimeout(() => {
      if (node.type === 'note' && node.originalNote) {
        if (isMobile) {
          setSelectedNote(node.originalNote);
        } else {
          navigate(`/note/${node.originalNote.id}`);
        }
      }
    }, 3000); // Wait for camera animation to complete
  };

  const getLinkColor = (link: NetworkLink) => {
    // Check if the link is connected to the highlighted node
    if (highlightedNodeRef.current && 
       (link.source.id === highlightedNodeRef.current.id || 
        link.target.id === highlightedNodeRef.current.id)) {
      return '#ea384c'; // Red color for highlighted links
    }
    
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

  const getLinkCurveGeometry = (link: NetworkLink) => {
    if (!settings.enableCurvedLinks) return null;
    if (isMobile) return null; // Disable curved links on mobile for better performance

    const source = link.source as NetworkNode;
    const target = link.target as NetworkNode;
    
    // Calculate middle point with an offset
    const middlePoint = {
      x: (source.x! + target.x!) / 2,
      y: (source.y! + target.y!) / 2,
      z: (source.z! + target.z!) / 2 + 5 // Add some height to create a curve
    };

    // Return points for the curve
    return [
      [source.x, source.y, source.z], // start
      [middlePoint.x, middlePoint.y, middlePoint.z], // middle control point
      [target.x, target.y, target.z] // end
    ];
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
        cooldownTime={isMobile ? 2000 : 3000} // Reduced cooldown time
        warmupTicks={isMobile ? 50 : 20} // Increased warmup ticks for better initial stability
        linkCurveRotation={settings.enableCurvedLinks && !isMobile ? 0.5 : 0}
        linkCurvature={settings.enableCurvedLinks && !isMobile ? 0.25 : 0}
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
