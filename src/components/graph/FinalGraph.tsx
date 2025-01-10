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

    // Create color scale
    const color = d3.scaleLinear<string>()
      .domain([0, 5])
      .range([theme === 'dark' ? '#0ea5e9' : '#7dd3fc', theme === 'dark' ? '#0369a1' : '#38bdf8'])
      .interpolate(d3.interpolateHcl);

    // Create pack layout
    const pack = d3.pack()
      .size([width, height])
      .padding(3);

    // Create hierarchy and calculate layout
    const rootNode = d3.hierarchy(processData())
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packedData = pack(rootNode);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .style("background-color", theme === 'dark' ? '#1e293b' : '#f8fafc')
      .style("cursor", "pointer");

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

    // Create container for nodes and labels
    const container = svg.append("g");

    // Create circles
    const node = container.selectAll("circle")
      .data(packedData.descendants().slice(1))
      .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "url(#bubble-gradient)")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .attr("stroke", theme === 'dark' ? '#0ea5e9' : '#38bdf8')
        .attr("stroke-width", d => d.height === 0 ? 1 : 2)
        .attr("stroke-opacity", 0.3);

    // Create labels
    const label = container.append("g")
      .style("font-family", "sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(packedData.descendants())
      .join("text")
        .style("fill", theme === 'dark' ? '#e2e8f0' : '#334155')
        .style("fill-opacity", d => d.parent === packedData ? 1 : 0)
        .style("display", d => d.parent === packedData ? "inline" : "none")
        .style("font-size", d => Math.min(d.r / 3, 14))
        .text(d => (d.data as any).name);

    // Initialize zoom state
    let focus = packedData;
    let view: [number, number, number];

    const zoomTo = (v: [number, number, number]) => {
      const k = width / v[2];
      view = v;

      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d => d.r * k);
    };

    const zoom = (event: any, d: d3.HierarchyNode<unknown>) => {
      const focus0 = focus;
      focus = d;

      const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return (t: number) => zoomTo(i(t));
        });

      label
        .filter(function(d) { 
          const element = d3.select(this);
          return d.parent === focus || element.style("display") === "inline"; 
        })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { 
            const element = d3.select(this);
            if (d.parent === focus) element.style("display", "inline"); 
          })
          .on("end", function(d) { 
            const element = d3.select(this);
            if (d.parent !== focus) element.style("display", "none"); 
          });
    };

    // Add zoom behavior
    svg.on("click", (event) => zoom(event, packedData));
    node.on("click", (event, d) => {
      if (focus !== d) {
        zoom(event, d);
        event.stopPropagation();
      }
    });

    // Initialize view
    zoomTo([packedData.x, packedData.y, packedData.r * 2]);

    // Add hover effects
    node
      .on("mouseover", function() {
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