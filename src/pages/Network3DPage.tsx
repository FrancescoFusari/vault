import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Network3DPage = () => {
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
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Network3DGraph notes={notes} />
      </div>
      <BottomNav />
    </div>
  );
};

export default Network3DPage;