import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

const NotesListPage = () => {
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-semibold">All Notes</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading notes. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-semibold">All Notes</h1>
      <NoteList notes={notes} />
    </div>
  );
};

export default NotesListPage;