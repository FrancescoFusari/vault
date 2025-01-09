import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const TagView = () => {
  const navigate = useNavigate();
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    }
  });

  // Create a map of tags to notes
  const tagMap = new Map<string, Note[]>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)?.push(note);
    });
  });

  // Sort tags by number of notes (most used first)
  const sortedTags = Array.from(tagMap.entries())
    .sort((a, b) => b[1].length - a[1].length);

  if (sortedTags.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No tags yet. Start by adding some notes!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedTags.map(([tag, tagNotes]) => (
        <div key={tag} className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {tag}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tagNotes.map(note => {
              const title = note.content.split('\n')[0].substring(0, 50) + 
                (note.content.length > 50 ? '...' : '');
              
              return (
                <Card 
                  key={note.id}
                  className="note-card cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/note/${note.id}`)}
                >
                  <CardHeader className="py-4">
                    <h3 className="font-medium">{title}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map(noteTag => (
                        <Badge 
                          key={noteTag} 
                          variant={noteTag === tag ? "default" : "outline"}
                          className="text-xs"
                        >
                          {noteTag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};