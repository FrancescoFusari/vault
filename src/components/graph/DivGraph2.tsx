import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGraphDimensions } from '@/hooks/useGraphDimensions';
import { Note } from '@/types/graph';
import { Badge } from "@/components/ui/badge";

interface DivGraph2Props {
  notes: Note[];
  highlightedNoteId?: string;
}

interface NodePosition {
  x: number;
  y: number;
}

interface Edge {
  from: NodePosition;
  to: NodePosition;
  id: string;
}

export const DivGraph2 = ({ notes, highlightedNoteId }: DivGraph2Props) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useGraphDimensions(containerRef, false);
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate positions for notes and tags
  useEffect(() => {
    const newPositions = new Map<string, NodePosition>();
    const newEdges: Edge[] = [];
    
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
    
    // Position notes in a circle
    notes.forEach((note, index) => {
      const angle = (2 * Math.PI * index) / notes.length;
      newPositions.set(note.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
      
      // Calculate tag positions using a spiral layout
      note.tags.forEach((tag, tagIndex) => {
        if (!newPositions.has(tag)) {
          const t = tagIndex * 0.5; // Reduced multiplier for tighter spiral
          const tagRadius = radius * 0.6; // Increased radius for better visibility
          const spiralAngle = t * 2 * Math.PI;
          const spiralRadius = tagRadius * (t / (2 * Math.PI));
          
          newPositions.set(tag, {
            x: centerX + spiralRadius * Math.cos(spiralAngle),
            y: centerY + spiralRadius * Math.sin(spiralAngle)
          });
        }
        
        // Create edges between notes and tags
        const fromPos = newPositions.get(note.id)!;
        const toPos = newPositions.get(tag)!;
        newEdges.push({
          from: fromPos,
          to: toPos,
          id: `${note.id}-${tag}`
        });
      });
    });
    
    setNodePositions(newPositions);
    setEdges(newEdges);
  }, [notes, dimensions]);

  const handleNodeClick = (id: string, type: 'note' | 'tag') => {
    if (type === 'note') {
      navigate(`/note/${id}`);
    } else {
      const connectedEdges = edges.filter(edge => 
        edge.id.includes(id)
      ).length;
      
      toast({
        title: `Tag: ${id}`,
        description: `Connected to ${connectedEdges} notes`,
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full border rounded-lg overflow-hidden bg-background relative"
      style={{ height: dimensions.height }}
    >
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <AnimatePresence>
            {edges.map((edge) => (
              <motion.line
                key={edge.id}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: hoveredNode ? 
                    (edge.id.includes(hoveredNode) ? 0.6 : 0.1) : 
                    0.3,
                  stroke: theme === 'dark' ? '#475569' : '#94a3b8'
                }}
                exit={{ pathLength: 0, opacity: 0 }}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                strokeWidth={hoveredNode && edge.id.includes(hoveredNode) ? 2 : 1}
                transition={{ duration: 0.5 }}
              />
            ))}
          </AnimatePresence>
        </svg>
        
        <AnimatePresence>
          {Array.from(nodePositions.entries()).map(([id, position]) => {
            const note = notes.find(n => n.id === id);
            const isNote = !!note;
            const isHighlighted = id === highlightedNoteId;
            const isHovered = id === hoveredNode;
            
            return (
              <motion.div
                key={id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: hoveredNode ? (isHovered || edges.some(e => e.id.includes(hoveredNode) && e.id.includes(id)) ? 1 : 0.3) : 1,
                  x: position.x - (isNote ? 75 : 50),
                  y: position.y - (isNote ? 30 : 15)
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className={`absolute cursor-pointer ${
                  isNote 
                    ? 'w-[150px] p-3 rounded-lg shadow-lg' 
                    : 'min-w-[100px] h-[30px] rounded-full flex items-center justify-center'
                } ${
                  isNote
                    ? theme === 'dark' ? 'bg-slate-800' : 'bg-white'
                    : theme === 'dark' ? 'bg-green-600/80' : 'bg-green-500/80'
                } ${
                  isHighlighted ? 'ring-2 ring-rose-500' : ''
                } ${
                  isHovered ? 'z-10' : 'z-0'
                }`}
                onClick={() => handleNodeClick(id, isNote ? 'note' : 'tag')}
                onHoverStart={() => setHoveredNode(id)}
                onHoverEnd={() => setHoveredNode(null)}
              >
                {isNote ? (
                  <div className="text-sm truncate">
                    {note?.tags[0] || note?.content.split('\n')[0].substring(0, 50)}
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-transparent whitespace-nowrap px-3">
                    {id}
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};