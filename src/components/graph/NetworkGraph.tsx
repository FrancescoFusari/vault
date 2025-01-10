import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Note } from '@/types/graph';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface NetworkGraphProps {
  notes: Note[];
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'note' | 'tag';
  value: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
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
          name: note.content.split('\n')[0].substring(0, 30) + '...',
          type: 'note',
          value: 1
        };
        nodes.push(noteNode);
        nodeMap.set(noteNode.id, noteNode);

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
    const nodeRadius = 5; // Base radius for collision detection

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("background-color", theme === 'dark' ? '#1e293b' : '#f8fafc');

    // Boundary force to keep nodes within the viewport
    const boundaryForce = () => {
      for (const node of data.nodes) {
        const r = node.value * nodeRadius;
        
        if (node.x! < r) {
          node.x = r;
          node.vx! *= -0.7; // Bounce with energy loss
        }
        if (node.x! > width - r) {
          node.x = width - r;
          node.vx! *= -0.7;
        }
        if (node.y! < r) {
          node.y = r;
          node.vy! *= -0.7;
        }
        if (node.y! > height - r) {
          node.y = height - r;
          node.vy! *= -0.7;
        }
      }
    };

    // Create force simulation with stronger forces
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(isMobile ? 50 : 100))
      .force("charge", d3.forceManyBody().strength(isMobile ? -150 : -300)) // Increased repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius((d: NetworkNode) => d.value * nodeRadius))
      .on("tick", () => {
        boundaryForce(); // Apply boundary force on each tick
        
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
          .attr("y", (d: NetworkNode) => (d.y || 0) - (d.value * nodeRadius + 10));
      });

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

    // Create nodes with increased initial velocity
    const node = container.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
        .attr("r", (d: NetworkNode) => d.value * nodeRadius)
        .attr("fill", (d: NetworkNode) => {
          if (d.type === 'tag') {
            return theme === 'dark' ? '#0ea5e9' : '#38bdf8';
          }
          return theme === 'dark' ? '#6366f1' : '#818cf8';
        })
        .attr("stroke", theme === 'dark' ? '#1e293b' : '#f8fafc')
        .attr("stroke-width", 2)
        .each((d: NetworkNode) => {
          // Add initial random velocity
          d.vx = (Math.random() - 0.5) * 5;
          d.vy = (Math.random() - 0.5) * 5;
        })
        .on("click", (event: any, d: NetworkNode) => {
          if (d.type === 'note') {
            const noteId = d.id.replace('note-', '');
            navigate(`/note/${noteId}`);
          } else {
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
        .on("mouseover", (event: any, d: NetworkNode) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", (d: NetworkNode) => d.value * (nodeRadius + 1));

          // Show tooltip
          const tooltip = svg.append("g")
            .attr("class", "tooltip")
            .attr("transform", `translate(${event.pageX},${event.pageY - 28})`);

          tooltip.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .style("font-size", "12px")
            .style("fill", theme === 'dark' ? '#e2e8f0' : '#334155')
            .text(d.name);
        })
        .on("mouseout", (event: any) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", (d: NetworkNode) => d.value * nodeRadius);

          svg.selectAll(".tooltip").remove();
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any);

    // Add labels
    const label = container.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
        .style("font-size", isMobile ? "8px" : "10px")
        .style("fill", theme === 'dark' ? '#e2e8f0' : '#334155')
        .style("pointer-events", "none")
        .style("text-anchor", "middle")
        .style("font-weight", "600")
        .text((d: NetworkNode) => d.name);

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      // Add some velocity after drag
      event.subject.vx = (Math.random() - 0.5) * 5;
      event.subject.vy = (Math.random() - 0.5) * 5;
    }

  }, [notes, theme, isMobile, toast, navigate]);

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
