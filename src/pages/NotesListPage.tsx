import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { TagsSidebar } from "@/components/TagsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NotesListPage = () => {
  const { data: notes, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      console.log('Fetching notes...');
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }
      
      console.log('Notes fetched:', data);
      return data || [];
    },
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TagsSidebar />
        <div className="flex-1">
          <div className="container mx-auto py-8 md:mt-16">
            <h1 className="text-2xl font-semibold mb-6">Vault</h1>
            {isLoading ? (
              <div className="text-center py-12">Loading notes...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-12">
                Error loading notes. Please try again.
              </div>
            ) : (
              <NoteList notes={notes} />
            )}
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default NotesListPage;