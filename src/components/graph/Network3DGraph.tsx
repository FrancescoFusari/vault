import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import { Link2Icon, SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as THREE from 'three';

interface Network3DGraphProps {
  notes: Note[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Network3DGraph = ({ notes, searchQuery, setSearchQuery }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<NetworkNode | null>(null);
  const [searchResults, setSearchResults] = useState<NetworkNode[]>([]);

  const { nodes, links, tagUsageCount, colorScale } = processNetworkData(notes);

  // Search and highlight functionality
  useEffect(() => {
    if (searchQuery) {
      console.log('Searching for:', searchQuery);
      const lowerQuery = searchQuery.toLowerCase();
      const results = nodes.filter(node => {
        const isMatch = node.name.toLowerCase().includes(lowerQuery) ||
          (node.type === 'tag' && node.name.toLowerCase().includes(lowerQuery));
        if (isMatch) {
          console.log('Found matching node:', node);
        }
        return isMatch;
      });

      setSearchResults(results);

      if (results.length > 0 && graphRef.current) {
        const foundNode = results[0];
        console.log('Setting highlighted node:', foundNode);
        setHighlightedNode(foundNode);
        
        // Center view on found node using cameraPosition
        const distance = 200; // Increased distance for better visibility
        const position = foundNode.x && foundNode.y && foundNode.z
          ? { x: foundNode.x, y: foundNode.y, z: foundNode.z + distance }
          : { x: 0, y: 0, z: distance };
        
        console.log('Moving camera to position:', position);
        graphRef.current.cameraPosition(
          position,
          foundNode, // Look directly at the node
          2000  // transition duration
        );
      } else {
        console.log('No matching node found');
        setHighlightedNode(null);
      }
    } else {
      setSearchResults([]);
      setHighlightedNode(null);
    }
  }, [searchQuery, nodes]);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    }
  }, [isMobile, navigate]);

  const handleSearchResultClick = (node: NetworkNode) => {
    setHighlightedNode(node);
    if (graphRef.current) {
      const distance = 200;
      const position = node.x && node.y && node.z
        ? { x: node.x, y: node.y, z: node.z + distance }
        : { x: 0, y: 0, z: distance };
      
      graphRef.current.cameraPosition(
        position,
        node,
        2000
      );
    }
  };

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
    
    // Highlight links connected to the highlighted node
    if (highlightedNode && 
       (link.source.id === highlightedNode.id || link.target.id === highlightedNode.id)) {
      return theme === 'dark' ? '#f43f5e' : '#e11d48';
    }
    
    const isUrlLink = 
      (link.source as NetworkNode).originalNote?.input_type === 'url' || 
      (link.target as NetworkNode).originalNote?.input_type === 'url';
    
    return isUrlLink 
      ? theme === 'dark' ? '#60a5fa' : '#3b82f6'
      : theme === 'dark' ? '#475569' : '#94a3b8';
  };

  const getNodeColor = (node: NetworkNode) => {
    // Highlight the searched/selected node
    if (highlightedNode && node.id === highlightedNode.id) {
      return theme === 'dark' ? '#f43f5e' : '#e11d48';
    }
    
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
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative max-w-md mx-auto">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search notes and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/80 backdrop-blur-sm"
          />
          {searchResults.length > 0 && (
            <div className="absolute w-full mt-2 p-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSearchResultClick(result)}
                  className={`w-full text-left px-3 py-2 rounded-md mb-1 last:mb-0 flex items-center gap-2 hover:bg-accent transition-colors ${
                    highlightedNode?.id === result.id ? 'bg-accent' : ''
                  }`}
                >
                  {result.type === 'tag' ? (
                    <div className="tag-badge"># {result.name}</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {result.originalNote?.input_type === 'url' && (
                        <Link2Icon className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="truncate">{result.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
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
