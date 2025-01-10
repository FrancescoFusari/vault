import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { NetworkNode, NetworkLink } from '@/utils/networkGraphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NetworkGraphSimulationProps {
  width: number;
  height: number;
  nodes: NetworkNode[];
  links: NetworkLink[];
  tagUsageCount: Map<string, number>;
  colorScale: d3.ScaleLinear<string, string>;
  onNodeClick: (node: NetworkNode) => void;
  settings: {
    linkDistance: number;
    chargeStrength: number;
    collisionRadius: number;
  };
}

export const NetworkGraphSimulation = ({
  width,
  height,
  nodes,
  links,
  tagUsageCount,
  colorScale,
  onNodeClick,
  settings
}: NetworkGraphSimulationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("background-color", theme === 'dark' ? '#1e293b' : '#f8fafc');

    // Create container for zoom
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Initialize simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(settings.linkDistance))
      .force("charge", d3.forceManyBody()
        .strength(settings.chargeStrength))
      .force("collision", d3.forceCollide()
        .radius((d: NetworkNode) => d.value * settings.collisionRadius))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke", theme === 'dark' ? '#475569' : '#94a3b8')
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d: NetworkLink) => Math.sqrt(d.value));

    // Create nodes
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", (d: NetworkNode) => d.value * settings.collisionRadius)
        .attr("fill", (d: NetworkNode) => {
          if (d.type === 'tag') {
            const usageCount = tagUsageCount.get(d.name) || 1;
            return colorScale(usageCount);
          }
          return theme === 'dark' ? '#6366f1' : '#818cf8';
        })
        .attr("stroke", theme === 'dark' ? '#1e293b' : '#f8fafc')
        .attr("stroke-width", 2)
        .on("click", (event: any, d: NetworkNode) => onNodeClick(d));

    // Add drag behavior
    node.call(d3.drag<any, NetworkNode>()
      .on("start", (event: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: any) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: any) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }) as any);

    // Add labels
    const label = container.append("g")
      .selectAll("text")
      .data(nodes)
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
    simulation.on("tick", () => {
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
        .attr("y", (d: NetworkNode) => (d.y || 0) - (d.value * settings.collisionRadius + 10));
    });

    // Restart simulation when settings change
    simulation.alpha(0.3).restart();

    return () => {
      simulation.stop();
    };
  }, [width, height, nodes, links, theme, isMobile, tagUsageCount, colorScale, onNodeClick, settings]);

  return <svg ref={svgRef} className="w-full h-full" />;
};