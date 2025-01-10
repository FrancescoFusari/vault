import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";

const NotesListPage = () => {
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
      <h1 className="text-2xl font-semibold">All Notes</h1>
      <NoteList notes={notes} />
      <BottomNav />
    </div>
  );
};

export default NotesListPage;