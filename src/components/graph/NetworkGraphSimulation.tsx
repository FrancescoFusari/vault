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
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

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

    // Add zoom behavior with limits
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Initialize simulation with stable configuration
    const simulation = d3.forceSimulation(nodes)
      .alpha(0.3)
      .alphaDecay(0.1) // Faster decay for quicker stabilization
      .velocityDecay(0.6) // Higher damping
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(settings.linkDistance)
        .strength(0.3)) // Reduced link strength
      .force("charge", d3.forceManyBody()
        .strength(settings.chargeStrength)
        .distanceMax(200)) // Limit charge effect range
      .force("collision", d3.forceCollide()
        .radius((d: NetworkNode) => d.value * settings.collisionRadius)
        .strength(0.8)) // Increased collision strength
      .force("center", d3.forceCenter(width / 2, height / 2)
        .strength(0.1)); // Gentle centering force

    simulationRef.current = simulation;

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke", theme === 'dark' ? '#475569' : '#94a3b8')
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d: NetworkLink) => Math.sqrt(d.value));

    // Create nodes with hover and click effects
    const node = container.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", (d: NetworkNode) => d.value * settings.collisionRadius)
        .attr("fill", (d: NetworkNode) => {
          if (d.type === 'tag') {
            const usageCount = tagUsageCount.get(d.name) ?? 1;
            return colorScale(usageCount);
          }
          return theme === 'dark' ? '#6366f1' : '#818cf8';
        })
        .attr("stroke", theme === 'dark' ? '#1e293b' : '#f8fafc')
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 3)
            .attr("stroke", theme === 'dark' ? '#94a3b8' : '#475569');
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 2)
            .attr("stroke", theme === 'dark' ? '#1e293b' : '#f8fafc');
        })
        .on("click", (event: any, d: NetworkNode) => {
          event.stopPropagation();
          event.preventDefault();
          
          // Only visual feedback, no simulation changes
          const element = d3.select(event.currentTarget);
          element
            .transition()
            .duration(100)
            .attr("r", (d: NetworkNode) => d.value * settings.collisionRadius * 1.2)
            .transition()
            .duration(100)
            .attr("r", (d: NetworkNode) => d.value * settings.collisionRadius);
          
          onNodeClick(d);
        });

    // Add drag behavior with minimal impact
    const drag = d3.drag<any, NetworkNode>()
      .on("start", (event: any) => {
        event.sourceEvent.stopPropagation();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: any) => {
        event.sourceEvent.stopPropagation();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: any) => {
        event.sourceEvent.stopPropagation();
        event.subject.fx = null;
        event.subject.fy = null;
      });

    node.call(drag as any);

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

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [width, height, nodes, links, theme, isMobile, tagUsageCount, colorScale, onNodeClick, settings]);

  return <svg ref={svgRef} className="w-full h-full" />;
};