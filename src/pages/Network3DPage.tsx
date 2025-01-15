import { Network3DGraph } from "@/components/graph/Network3DGraph";
import { BottomNav } from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const Network3DPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
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
    <div className="fixed inset-0 flex flex-col h-screen w-screen">
      <div className="relative flex-1 w-full h-full">
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search notes and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur-sm"
            />
          </div>
        </div>
        <Network3DGraph notes={notes} searchQuery={searchQuery} />
      </div>
      <BottomNav />
    </div>
  );
};

export default Network3DPage;