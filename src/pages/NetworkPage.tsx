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
    <div className="min-h-screen md:container md:mx-auto md:py-8 md:space-y-8">
      <h1 className="text-2xl font-semibold p-4 md:p-0">Network View</h1>
      <div className="h-[calc(100vh-8rem)] md:h-[600px]">
        <NetworkGraph notes={notes} />
      </div>
      <BottomNav />
    </div>
  );
};

export default NetworkPage;