import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteDetail } from "@/components/NoteDetail";

const NotePage = () => {
  const { id } = useParams<{ id: string }>();

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

  const note = notes.find(n => n.id === id);

  if (!note) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <NoteDetail note={note} allNotes={notes} />
    </div>
  );
};

export default NotePage;