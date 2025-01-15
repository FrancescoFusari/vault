import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Note } from "@/types/graph";
import { useGraphDimensions } from "@/hooks/useGraphDimensions";
import { useRef } from "react";
import { useToast } from "../ui/use-toast";
import { useNavigate } from "react-router-dom";

interface DivGraphProps {
  notes: Note[];
  highlightedNoteId?: string;
}

export const DivGraph = ({ notes, highlightedNoteId }: DivGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dimensions = useGraphDimensions(containerRef, false);

  // Calculate positions and tag usage
  const tagUsageCount = new Map<string, number>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      tagUsageCount.set(tag, (tagUsageCount.get(tag) || 0) + 1);
    });
  });
  const maxTagCount = Math.max(...Array.from(tagUsageCount.values()), 1);

  // Calculate dimensions
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleTagClick = (tag: string) => {
    const connectedNotes = notes.filter(note => note.tags.includes(tag)).length;
    toast({
      title: `Tag: ${tag}`,
      description: `Connected to ${connectedNotes} notes`,
    });
  };

  return (
    <div 
      ref={containerRef}
      className="w-full border rounded-lg overflow-hidden bg-background relative"
      style={{ height: dimensions.height }}
    >
      <div className="absolute inset-0">
        {/* Notes */}
        {notes.map((note, index) => {
          const angle = (2 * Math.PI * index) / notes.length;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const title = note.content.split('\n')[0].substring(0, 30);

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: x - 40, // Offset by half the width
                y: y - 40, // Offset by half the height
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleNoteClick(note.id)}
              className="absolute cursor-pointer"
              style={{
                width: 80,
                height: 80,
              }}
            >
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center p-2 text-xs text-center
                  ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}
                  ${note.id === highlightedNoteId ? 'border-2 border-rose-500' : 'border border-slate-200'}
                  shadow-sm hover:scale-110 transition-transform duration-200`}
              >
                {title}
              </div>
            </motion.div>
          );
        })}

        {/* Tags */}
        {Array.from(tagUsageCount.entries()).map(([tag, count], index) => {
          const goldenRatio = 1.618033988749895;
          const t = index * goldenRatio;
          const tagRadius = radius * 0.2;
          const spiralAngle = t * 2 * Math.PI;
          const spiralRadius = tagRadius * (t / (2 * Math.PI));
          const actualRadius = Math.min(spiralRadius, tagRadius);
          const scale = 0.5 + (count / maxTagCount) * 1.5;
          
          const x = centerX + actualRadius * Math.cos(spiralAngle);
          const y = centerY + actualRadius * Math.sin(spiralAngle);

          return (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: scale,
                x: x - 10, // Offset by half the width
                y: y - 10, // Offset by half the height
              }}
              transition={{ duration: 0.5, delay: (notes.length + index) * 0.1 }}
              onClick={() => handleTagClick(tag)}
              className="absolute cursor-pointer"
              style={{
                width: 20,
                height: 20,
              }}
            >
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center
                  ${theme === 'dark' ? 'bg-green-600' : 'bg-green-500'}
                  text-white hover:scale-110 transition-transform duration-200`}
              >
                ●
              </div>
            </motion.div>
          );
        })}

        {/* Edges */}
        <svg className="absolute inset-0 pointer-events-none">
          {notes.map(note => 
            note.tags.map(tag => {
              const noteIndex = notes.findIndex(n => n.id === note.id);
              const noteAngle = (2 * Math.PI * noteIndex) / notes.length;
              const noteX = centerX + radius * Math.cos(noteAngle);
              const noteY = centerY + radius * Math.sin(noteAngle);

              const tagIndex = Array.from(tagUsageCount.keys()).indexOf(tag);
              const goldenRatio = 1.618033988749895;
              const t = tagIndex * goldenRatio;
              const tagRadius = radius * 0.2;
              const spiralAngle = t * 2 * Math.PI;
              const spiralRadius = tagRadius * (t / (2 * Math.PI));
              const actualRadius = Math.min(spiralRadius, tagRadius);
              
              const tagX = centerX + actualRadius * Math.cos(spiralAngle);
              const tagY = centerY + actualRadius * Math.sin(spiralAngle);

              return (
                <motion.line
                  key={`${note.id}-${tag}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 1 }}
                  x1={noteX}
                  y1={noteY}
                  x2={tagX}
                  y2={tagY}
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  strokeWidth="1"
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};