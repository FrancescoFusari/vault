import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

export const TagView = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
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

  const getPreviewContent = (content: string) => {
    const words = content.split(' ');
    return words.slice(0, 18).join(' ') + (words.length > 18 ? '...' : '');
  };

  if (sortedTags.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No tags yet. Start by adding some notes!
      </div>
    );
  }

  if (selectedTag) {
    const tagNotes = tagMap.get(selectedTag) || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedTag(null)}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to all tags
          </button>
          <Badge variant="secondary" className="text-sm">
            {selectedTag} ({tagNotes.length})
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tagNotes.map(note => (
            <Card 
              key={note.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(`/note/${note.id}`)}
            >
              <CardHeader className="space-y-2">
                <h3 className="font-medium text-lg">
                  {note.content.split('\n')[0].substring(0, 50)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getPreviewContent(note.content)}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sortedTags.map(([tag, tagNotes]) => (
        <Card 
          key={tag}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setSelectedTag(tag)}
        >
          <CardHeader className="space-y-2">
            <Badge variant="secondary" className="text-sm inline-block">
              {tag}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};