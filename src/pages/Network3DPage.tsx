import Network3DGraph from "@/components/graph/Network3DGraph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processGraphData } from "@/utils/graphUtils";
import { useTheme } from "next-themes";

const defaultSettings = {
  nodeSize: 1,
  linkWidth: 1,
  charge: -30
};

const Network3DPage = () => {
  const { theme } = useTheme();
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

  const graphData = processGraphData(notes, undefined, theme);

  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen">
      <div className="flex-1 relative w-full h-full mt-16">
        <Network3DGraph data={graphData} settings={defaultSettings} />
      </div>
    </div>
  );
};

export default Network3DPage;