import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";
import { ForceGraphMethods } from "react-force-graph-3d";
import { NetworkNode, processNetworkData } from "@/utils/networkGraphUtils";

const Network3DPage = () => {
  const graphRef = useRef<ForceGraphMethods>();
  
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { nodes } = processNetworkData(notes);

  const handleNodeSelect = (node: NetworkNode) => {
    if (!graphRef.current) return;
    
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    graphRef.current.cameraPosition(
      { 
        x: (node.x || 0) * distRatio, 
        y: (node.y || 0) * distRatio, 
        z: (node.z || 0) * distRatio 
      },
      { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
      1000
    );
  };

  return (
    <div className="fixed inset-0">
      <GraphSearch nodes={nodes} onNodeSelect={handleNodeSelect} />
      <div className="w-full h-screen pt-16 pb-16 md:pb-0">
        <Network3DGraph ref={graphRef} notes={notes} />
      </div>
    </div>
  );
};

export default Network3DPage;