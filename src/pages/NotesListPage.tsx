import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const NotesListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch both notes and batch items
  const { data: notes = [], isLoading: notesLoading, error: notesError } = useQuery({
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
      console.log('Fetched notes:', data);
      return data || [];
    }
  });

  const { data: batchItems = [], isLoading: batchLoading } = useQuery({
    queryKey: ['batch-items'],
    queryFn: async () => {
      console.log('Fetching batch items...');
      const { data, error } = await supabase
        .from('batch_processing_queue')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching batch items:', error);
        throw error;
      }
      console.log('Fetched batch items:', data);
      
      // Convert batch items to note format
      return (data || []).map(item => ({
        id: item.id,
        content: item.content,
        category: 'URL Content', // Default category for URL content
        tags: ['url-content'], // Default tag for URL content
        created_at: item.created_at,
        input_type: item.input_type,
        source_url: item.source_url
      }));
    }
  });

  const isLoading = notesLoading || batchLoading;

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

  if (notesError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading notes. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Combine notes and processed batch items
  const allNotes = [...notes, ...batchItems];

  // Filter notes based on search query
  const filteredNotes = allNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.content.toLowerCase().includes(searchLower) ||
      note.category.toLowerCase().includes(searchLower) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">All Notes</h1>
        <Input
          type="search"
          placeholder="Search notes by content, category, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xl"
        />
      </div>
      <NoteList notes={filteredNotes} />
    </div>
  );
};

export default NotesListPage;