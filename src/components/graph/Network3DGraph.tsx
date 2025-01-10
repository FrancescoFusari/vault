import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import ForceGraph3D from 'react-force-graph-3d';
import { NotePopupWindow } from './NotePopupWindow';
import { processNetworkData, NetworkNode } from '@/utils/networkGraphUtils';
import { Note } from '@/types/graph';
import * as d3 from 'd3';

interface Network3DGraphProps {
  notes: Note[];
}

interface GraphState {
  graphData: any;
  tagUsageCount: Map<string, number>;
  colorScale: d3.ScaleLinear<string, string>;
}

export const Network3DGraph = ({ notes }: Network3DGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dimensions = useGraphDimensions(containerRef, isMobile);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [graphState, setGraphState] = useState<GraphState | null>(null);

  useEffect(() => {
    if (!notes || notes.length === 0) {
      return;
    }

    // Process notes to include both regular notes and batch items
    const processedNotes = notes
      .filter(note => note && note.content)
      .map(note => ({
        ...note,
        category: note.category || 'Uncategorized',
        tags: (note.tags || []).filter(Boolean)
      }));

    const { nodes, links, tagUsageCount, colorScale } = processNetworkData(processedNotes);

    // Create a map of valid node IDs for quick lookup
    const validNodeIds = new Set(nodes.map(node => node.id));

    // Ensure all nodes and links are properly formatted
    const formattedData = {
      nodes: nodes.map(node => ({
        ...node,
        id: node.id.toString(),
      })),
      links: links
        .filter(link => 
          validNodeIds.has(link.source?.toString()) && 
          validNodeIds.has(link.target?.toString())
        )
        .map(link => ({
          ...link,
          source: link.source.toString(),
          target: link.target.toString(),
        }))
    };

    setGraphState({
      graphData: formattedData,
      tagUsageCount,
      colorScale
    });
  }, [notes]);

  const handleNodeClick = (node: NetworkNode) => {
    if (node.type === 'note' && node.originalNote) {
      if (isMobile) {
        setSelectedNote(node.originalNote);
      } else {
        navigate(`/note/${node.originalNote.id}`);
      }
    }
  };

  if (!graphState) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
    >
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphState.graphData}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (node.type === 'tag') {
            const usageCount = graphState.tagUsageCount.get(node.name) ?? 1;
            return graphState.colorScale(usageCount);
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