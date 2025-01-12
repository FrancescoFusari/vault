import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteDetail } from "@/components/NoteDetail";
import { Skeleton } from "@/components/ui/skeleton";

const NotePage = () => {
  const { id } = useParams();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!note) {
    return <div className="container">Note not found</div>;
  }

  return (
    <div className="container">
      <NoteDetail note={note} />
    </div>
  );
};

export default NotePage;