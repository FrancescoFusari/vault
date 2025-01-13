import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoteDetail } from "@/components/NoteDetail";
import { Skeleton } from "@/components/ui/skeleton";

type NoteMetadata = {
  technical_details?: string;
  visual_elements?: string[];
  color_palette?: string[];
  composition_notes?: string;
  estimated_date_or_period?: string;
};

type Note = {
  id: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  source_image_path?: string;
  metadata: NoteMetadata | null;
};

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

      // Transform the data to match the expected type
      const transformedNote: Note = {
        id: data.id,
        content: data.content,
        category: data.category,
        tags: data.tags,
        created_at: data.created_at,
        source_image_path: data.source_image_path || undefined,
        metadata: data.metadata as NoteMetadata || null,
      };

      return transformedNote;
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