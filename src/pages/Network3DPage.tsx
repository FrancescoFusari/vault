import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { GraphSearch } from "@/components/graph/GraphSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";
import { ForceGraphMethods } from "react-force-graph-3d";

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

  const handleNodeSelect = (nodeId: string) => {
    if (!graphRef.current) return;
    
    // Find the node in the graph data
    const graphData = graphRef.current.graphData();
    const node = graphData.nodes.find((n: any) => n.id === nodeId);
    
    if (node) {
      // Center view on node
      graphRef.current.centerAt(node.x, node.y, node.z, 1000);
      graphRef.current.zoom(1.5, 1000);
    }
  };

  return (
    <div className="fixed inset-0">
      <div className="w-full h-screen pt-16 pb-16 md:pb-0 relative">
        <GraphSearch 
          nodes={graphRef.current?.graphData().nodes || []} 
          onNodeSelect={handleNodeSelect}
        />
        <Network3DGraph 
          notes={notes} 
          graphRef={graphRef}
        />
      </div>
    </div>
  );
};

export default Network3DPage;