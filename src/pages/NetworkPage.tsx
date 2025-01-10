import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NetworkPage = () => {
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Network View</h1>
      <NetworkGraph notes={notes} />
      <BottomNav />
    </div>
  );
};

export default NetworkPage;