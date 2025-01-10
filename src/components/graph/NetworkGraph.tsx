import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Note } from '@/types/graph';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { NetworkGraphSettings } from './NetworkGraphSettings';
import { NotePopupWindow } from './NotePopupWindow';

interface NetworkGraphProps {
  notes: Note[];
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  originalNote?: Note;
  x?: number;
  y?: number;
}

interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

export const NetworkGraph = ({ notes }: NetworkGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [graphSettings, setGraphSettings] = useState({
    linkDistance: isMobile ? 50 : 100,
    chargeStrength: isMobile ? -100 : -200,
    collisionRadius: 5,
  });

  const handleSettingChange = (setting: string, value: number) => {
    setGraphSettings(prev => ({ ...prev, [setting]: value }));
    
    if (simulation) {
      simulation
        .force("link", d3.forceLink()
          .id((d: any) => d.id)
          .distance(setting === 'linkDistance' ? value : graphSettings.linkDistance))
        .force("charge", d3.forceManyBody()
          .strength(setting === 'chargeStrength' ? value : graphSettings.chargeStrength))
        .force("collision", d3.forceCollide()
          .radius((d: NetworkNode) => d.value * (setting === 'collisionRadius' ? value : graphSettings.collisionRadius)))
        .alpha(1)
        .restart();
    }
  };

  useEffect(() => {
    if (!svgRef.current || !notes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data to create network structure
    const processData = () => {
      const nodes: NetworkNode[] = [];
      const links: NetworkLink[] = [];
      const allTags = new Set<string>();
      const nodeMap = new Map<string, NetworkNode>();

      // First collect all tags
      notes.forEach(note => {
        note.tags.forEach(tag => allTags.add(tag));
      });

      // Add tag nodes
      Array.from(allTags).forEach(tag => {
        const tagNode: NetworkNode = {
          id: `tag-${tag}`,
          name: tag,
          type: 'tag',
          value: notes.filter(note => note.tags.includes(tag)).length * 2
        };
        nodes.push(tagNode);
        nodeMap.set(tagNode.id, tagNode);
      });

      // Add note nodes and links
      notes.forEach(note => {
        const noteId = `note-${note.id}`;
        const noteNode: NetworkNode = {
          id: noteId,
          name: note.tags[0] || note.content.split('\n')[0].substring(0, 30) + '...', // Use first tag as title
          type: 'note',
          value: 2,
          originalNote: note
        };
        nodes.push(noteNode);
        nodeMap.set(noteId, noteNode);

        // Create links between notes and their tags
        note.tags.forEach(tag => {
          const tagNode = nodeMap.get(`tag-${tag}`);
          if (tagNode) {
            links.push({
              source: noteNode,
              target: tagNode,
              value: 1
            });
          }
        });
      });

      return { nodes, links };
    };

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const data = processData();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("background-color", theme === 'dark' ? '#1e293b' : '#f8fafc');

    // Create force simulation
    const newSimulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(graphSettings.linkDistance))
      .force("charge", d3.forceManyBody().strength(graphSettings.chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius((d: NetworkNode) => d.value * graphSettings.collisionRadius));

    setSimulation(newSimulation);

    // Create container for zoom
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
        .attr("stroke", theme === 'dark' ? '#475569' : '#94a3b8')
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d: NetworkLink) => Math.sqrt(d.value));

    // Create nodes with larger size for notes
    const node = container.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
        .attr("r", (d: NetworkNode) => {
          // Make note nodes significantly larger
          if (d.type === 'note') {
            return d.value * graphSettings.collisionRadius * 3;
          }
          return d.value * graphSettings.collisionRadius;
        })
        .attr("fill", (d: NetworkNode) => {
          if (d.type === 'tag') {
            return theme === 'dark' ? '#0ea5e9' : '#38bdf8';
          }
          return theme === 'dark' ? '#6366f1' : '#818cf8';
        })
        .attr("stroke", theme === 'dark' ? '#1e293b' : '#f8fafc')
        .attr("stroke-width", 2)
        .on("click", (event: any, d: NetworkNode) => {
          if (d.type === 'note' && d.originalNote) {
            setSelectedNote(d.originalNote);
          } else if (d.type === 'tag') {
            toast({
              title: `Tag: ${d.name}`,
              description: `Connected to ${
                data.links.filter(link => 
                  link.source.id === d.id || link.target.id === d.id
                ).length
              } notes`,
            });
          }
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any);

    // Add labels with larger font for note titles
    const label = container.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
        .style("font-size", (d: NetworkNode) => 
          d.type === 'note' ? (isMobile ? "10px" : "12px") : (isMobile ? "8px" : "10px")
        )
        .style("fill", theme === 'dark' ? '#e2e8f0' : '#334155')
        .style("pointer-events", "none")
        .style("text-anchor", "middle")
        .style("font-weight", (d: NetworkNode) => d.type === 'note' ? "600" : "400")
        .text((d: NetworkNode) => d.name);

    // Update positions on simulation tick
    newSimulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: NetworkNode) => d.x || 0)
        .attr("cy", (d: NetworkNode) => d.y || 0);

      label
        .attr("x", (d: NetworkNode) => d.x || 0)
        .attr("y", (d: NetworkNode) => (d.y || 0) - (d.value * graphSettings.collisionRadius + 10));
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) newSimulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) newSimulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

  }, [notes, theme, isMobile, toast, navigate, graphSettings]);

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden relative">
      <NetworkGraphSettings 
        settings={graphSettings}
        onSettingChange={handleSettingChange}
      />
      <svg ref={svgRef} className="w-full h-full" />
      {selectedNote && (
        <NotePopupWindow
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
};