import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import { useTheme } from 'next-themes';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  val: number;
  color?: string;
  type: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphSettings {
  nodeSize: number;
  linkWidth: number;
  charge: number;
}

interface Network3DGraphProps {
  data: GraphData;
  settings: GraphSettings;
}

const Network3DGraph = ({ data, settings }: Network3DGraphProps) => {
  const fgRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleNodeClick = useCallback((node: any) => {
    const sprite = new SpriteText(node.name);
    sprite.position.copy(node.position);
    sprite.textHeight = 8;
    sprite.backgroundColor = 'rgba(0,0,0,0.8)';
    sprite.padding = 2;
    sprite.borderRadius = 3;
    
    if (node.type === 'note') {
      navigate(`/note/${node.id}`);
    } else if (node.type === 'tag') {
      navigate(`/tags?selected=${node.id}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (!fgRef.current) return;

    const Graph = new ForceGraph3D();
    const fg = Graph(fgRef.current)
      .graphData(data)
      .nodeVal((node: any) => node.val * settings.nodeSize)
      .nodeLabel('name')
      .nodeColor((node: any) => node.color || (theme === 'dark' ? '#EF7234' : '#1B1B1F'))
      .linkWidth(settings.linkWidth)
      .linkColor(() => theme === 'dark' ? '#2A2A2E' : '#E0E0D7')
      .backgroundColor('transparent')
      .onNodeClick(handleNodeClick)
      .d3Force('charge', null)
      .d3Force('charge', d3.forceManyBody().strength(settings.charge));

    // Add camera controls
    const controls = fg.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;

    // Handle window resize
    const handleResize = () => {
      fg.width(window.innerWidth)
        .height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, settings, theme, handleNodeClick]);

  return <div ref={fgRef} />;
};

export default Network3DGraph;