import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { TagsSidebar } from "@/components/TagsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

const NotesListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredNotes = notes?.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TagsSidebar />
        <div className="flex-1">
          <div className="container mx-auto py-8 md:mt-16">
            <div className="flex flex-col space-y-6">
              <h1 className="text-2xl font-semibold">Vault</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search notes and tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isLoading ? (
                <div className="text-center py-12">Loading notes...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">
                  Error loading notes. Please try again.
                </div>
              ) : (
                <NoteList notes={filteredNotes} />
              )}
            </div>
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default NotesListPage;