import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface Categories {
  [key: string]: string[];
}

export const TagView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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

  const { data: savedCategories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('categories')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.categories as Categories | null;
    }
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (categories: Categories) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tag_categories')
        .upsert({ 
          categories,
          user_id: user.id 
        }, { 
          onConflict: 'user_id' 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-categories'] });
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

  const categorizeTags = async () => {
    setIsLoading(true);
    try {
      const allTags = Array.from(tagMap.keys());
      const { data, error } = await supabase.functions.invoke('categorize-tags', {
        body: { tags: allTags }
      });

      if (error) throw error;
      
      // Save categories to database
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Tags categorized",
        description: "Your tags have been organized and saved",
      });
    } catch (error) {
      console.error('Error categorizing tags:', error);
      toast({
        title: "Error",
        description: "Failed to categorize tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we need to show the categorize button
  const shouldShowCategorizeButton = () => {
    if (!savedCategories) return true;
    const currentTags = Array.from(tagMap.keys());
    const savedTags = Object.values(savedCategories).flat();
    return currentTags.some(tag => !savedTags.includes(tag));
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
    <div className="space-y-8">
      {shouldShowCategorizeButton() && (
        <div className="flex justify-between items-center">
          <Button 
            onClick={categorizeTags} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Categorizing..." : "Categorize Tags"}
          </Button>
        </div>
      )}

      {savedCategories && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(savedCategories).map(([category, tags]) => (
              <Card key={category}>
                <CardHeader>
                  <h3 className="font-medium">{category}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge 
                        key={tag}
                        className="cursor-pointer hover:bg-primary"
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!savedCategories || shouldShowCategorizeButton()) && (
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
      )}
    </div>
  );
};