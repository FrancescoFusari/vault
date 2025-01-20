import React, { useEffect, useRef } from "react";
import { ForceGraph3D } from "react-force-graph-3d";
import { NetworkNode } from "@/utils/networkGraphUtils";
import * as THREE from "three";
import { SpriteText } from "three-spritetext";

interface Network3DGraphProps {
  notes: NetworkNode[];
}

const Network3DGraph = React.forwardRef<ForceGraphMethods, Network3DGraphProps>(({ notes }, ref) => {
  const graphRef = useRef<ForceGraphMethods>(null);

  useEffect(() => {
    if (ref) {
      ref.current = graphRef.current;
    }
  }, [ref]);

  const nodeThreeObject = (node: NetworkNode) => {
    const group = new THREE.Group();

    if (node.type === 'note') {
      const geometry = new THREE.SphereGeometry(2);
      const material = new THREE.MeshLambertMaterial({ color: 'hsl(24 89% 57%)' });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);

      const sprite = new SpriteText(node.name);
      sprite.color = 'hsl(24 89% 57%)';
      sprite.textHeight = 2;
      sprite.backgroundColor = 'rgba(0,0,0,0.5)';
      sprite.padding = 1;
      sprite.borderRadius = 2;
      
      group.add(sprite);
      sprite.translateX(4);
      
      return group;
    } else if (node.type === 'tag') {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshLambertMaterial({ color: 'hsl(24 89% 40%)' });
      const cube = new THREE.Mesh(geometry, material);
      group.add(cube);

      const sprite = new SpriteText(`#${node.name}`);
      sprite.color = 'hsl(24 89% 40%)';
      sprite.textHeight = 1.5;
      sprite.backgroundColor = 'rgba(0,0,0,0.3)';
      sprite.padding = 0.5;
      sprite.borderRadius = 1;
      
      group.add(sprite);
      sprite.translateX(3);
      
      return group;
    }
    
    return group;
  };

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={{ nodes: notes }}
      nodeThreeObject={nodeThreeObject}
      onNodeClick={(node) => {
        console.log("Node clicked:", node);
      }}
      backgroundColor="hsl(0 0% 10%)"
    />
  );
});

Network3DGraph.displayName = "Network3DGraph";

export { Network3DGraph };
