import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Note } from '@/types/graph';

interface FinalGraphProps {
  notes: Note[];
}

export const FinalGraph = ({ notes }: FinalGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || !notes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data to create hierarchical structure
    const processData = () => {
      const categories = Array.from(new Set(notes.map(note => note.category)));
      const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
      
      // Create hierarchical data structure
      const root = {
        name: "root",
        children: categories.map(category => {
          const categoryNotes = notes.filter(note => note.category === category);
          const categoryTags = Array.from(new Set(categoryNotes.flatMap(note => note.tags)));
          
          return {
            name: category,
            children: categoryTags.map(tag => ({
              name: tag,
              value: categoryNotes.filter(note => note.tags.includes(tag)).length * 100
            }))
          };
        })
      };

      return root;
    };

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create pack layout
    const pack = d3.pack()
      .size([width, height])
      .padding(20);

    // Create hierarchy and calculate layout
    const root = d3.hierarchy(processData())
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packedData = pack(root);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", theme === 'dark' ? '#1e293b' : '#f8fafc');

    // Create gradient definitions
    const defs = svg.append("defs");
    const gradient = defs.append("radialGradient")
      .attr("id", "bubble-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", theme === 'dark' ? '#0ea5e9' : '#7dd3fc')
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", theme === 'dark' ? '#0369a1' : '#38bdf8')
      .attr("stop-opacity", 0.1);

    // Create groups for each node
    const node = svg.selectAll("g")
      .data(packedData.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add circles
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", "url(#bubble-gradient)")
      .attr("stroke", theme === 'dark' ? '#0ea5e9' : '#38bdf8')
      .attr("stroke-width", d => d.height === 0 ? 1 : 2)
      .attr("stroke-opacity", 0.3);

    // Add labels
    node.append("text")
      .filter(d => d.height === 0)
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("font-size", d => Math.min(d.r / 3, 14))
      .style("fill", theme === 'dark' ? '#e2e8f0' : '#334155')
      .text(d => (d.data as any).name);

    // Add hover effects
    node.on("mouseover", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0.8);
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1);
    });

  }, [notes, theme]);

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};