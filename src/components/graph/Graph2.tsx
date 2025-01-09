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
  
  // Convert notes to nodes and edges
  const getNodesAndEdges = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, boolean>();

    notes.forEach((note) => {
      // Add note node
      if (!nodeMap.has(note.id)) {
        nodes.push({
          id: note.id,
          type: 'noteNode',
          data: { 
            label: note.tags[0] || note.content.substring(0, 40) + '...',
            type: 'note',
            isHighlighted: note.id === highlightedNoteId
          },
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          style: {
            background: theme === 'dark' ? '#1e293b' : '#f8fafc',
            border: note.id === highlightedNoteId ? '2px solid #f43f5e' : undefined,
          },
        });
        nodeMap.set(note.id, true);
      }

      // Add category node and edge
      if (!nodeMap.has(note.category)) {
        nodes.push({
          id: note.category,
          type: 'categoryNode',
          data: { 
            label: note.category,
            type: 'category'
          },
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          style: {
            background: theme === 'dark' ? '#f59e0b' : '#d97706',
            color: 'white',
          },
        });
        nodeMap.set(note.category, true);
      }
      edges.push({
        id: `${note.id}-${note.category}`,
        source: note.id,
        target: note.category,
        animated: note.id === highlightedNoteId,
      });

      // Add tag nodes and edges
      note.tags.forEach((tag) => {
        if (!nodeMap.has(tag)) {
          nodes.push({
            id: tag,
            type: 'tagNode',
            data: { 
              label: tag,
              type: 'tag'
            },
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            style: {
              background: theme === 'dark' ? '#22c55e' : '#16a34a',
              color: 'white',
            },
          });
          nodeMap.set(tag, true);
        }
        edges.push({
          id: `${note.id}-${tag}`,
          source: note.id,
          target: tag,
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
  }, [notes, highlightedNoteId, theme]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.data.type === 'note') {
      navigate(`/note/${node.id}`);
    } else {
      toast({
        title: `${node.data.type === 'category' ? 'Category' : 'Tag'}: ${node.data.label}`,
        description: `Connected to ${
          edges.filter(edge => 
            edge.source === node.id || edge.target === node.id
          ).length
        } notes`,
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
          backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc'
        }}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'note':
                return theme === 'dark' ? '#94a3b8' : '#475569';
              case 'category':
                return theme === 'dark' ? '#f59e0b' : '#d97706';
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