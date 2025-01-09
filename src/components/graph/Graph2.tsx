import { useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './Graph2.css';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { Note } from '@/types/graph';

interface Graph2Props {
  notes: Note[];
  highlightedNoteId?: string;
}

export const Graph2 = ({ notes, highlightedNoteId }: Graph2Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, false);
  
  const getNodesAndEdges = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, boolean>();
    const tagUsageCount = new Map<string, number>();

    // Count tag usage
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagUsageCount.set(tag, (tagUsageCount.get(tag) || 0) + 1);
      });
    });

    const maxTagCount = Math.max(...Array.from(tagUsageCount.values()), 1);
    
    // Calculate dimensions based on container size
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35; // Adjust radius based on container size
    
    // Position notes in a polygon
    notes.forEach((note, index) => {
      if (notes.length === 0) return;
      
      // Calculate angle for even distribution
      const angle = (2 * Math.PI * index) / notes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (!nodeMap.has(note.id)) {
        const title = note.content.split('\n')[0].substring(0, 30);
        nodes.push({
          id: note.id,
          type: 'noteNode',
          data: { 
            label: title,
            type: 'note',
            isHighlighted: note.id === highlightedNoteId
          },
          position: { x, y },
          className: 'circle-node note-node',
          style: {
            background: theme === 'dark' ? '#1e293b' : '#f8fafc',
            border: note.id === highlightedNoteId ? '2px solid #f43f5e' : undefined,
          },
        });
        nodeMap.set(note.id, true);
      }

      // Add tag nodes and edges
      note.tags.forEach((tag) => {
        if (!nodeMap.has(tag)) {
          const tagCount = tagUsageCount.get(tag) || 1;
          const scale = 0.5 + (tagCount / maxTagCount) * 1.5; // Scale between 0.5 and 2
          
          // Position tags in inner circle with random variation
          const randomAngle = Math.random() * 2 * Math.PI;
          const randomRadius = (radius * 0.3) * Math.random(); // Keep tags within 30% of the center
          const tagX = centerX + randomRadius * Math.cos(randomAngle);
          const tagY = centerY + randomRadius * Math.sin(randomAngle);

          nodes.push({
            id: tag,
            type: 'tagNode',
            data: { 
              label: '●',
              type: 'tag'
            },
            position: { x: tagX, y: tagY },
            className: 'circle-node tag-node',
            style: {
              background: theme === 'dark' ? '#22c55e' : '#16a34a',
              color: 'white',
              transform: `scale(${scale})`,
            },
          });
          nodeMap.set(tag, true);
        }
        edges.push({
          id: `${note.id}-${tag}`,
          source: note.id,
          target: tag,
          className: 'thin-edge',
        });
      });
    });

    return { nodes, edges };
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [notes, highlightedNoteId, theme, dimensions.width, dimensions.height]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.data.type === 'note') {
      navigate(`/note/${node.id}`);
    } else if (node.data.type === 'tag') {
      const connectedNotes = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length;
      
      toast({
        title: `Tag: ${node.id}`,
        description: `Connected to ${connectedNotes} notes`,
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full border rounded-lg overflow-hidden bg-background relative"
      style={{ height: dimensions.height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.5}
        maxZoom={8}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        style={{
          backgroundColor: theme === 'dark' ? '#020617' : '#f8fafc'
        }}
      >
        <Background color={theme === 'dark' ? '#334155' : '#94a3b8'} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'note':
                return theme === 'dark' ? '#94a3b8' : '#475569';
              case 'tag':
                return theme === 'dark' ? '#22c55e' : '#16a34a';
              default:
                return '#666';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};