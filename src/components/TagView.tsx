import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [isCategorizing, setIsCategorizing] = useState(false);
  
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

  const categorizeCategories = async () => {
    if (!savedCategories) return;
    
    setIsCategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('categorize-categories', {
        body: { categories: savedCategories }
      });

      if (error) throw error;
      
      await saveCategoriesMutation.mutateAsync(data);
      
      toast({
        title: "Categories organized",
        description: "Your categories have been organized into life sections",
      });
    } catch (error) {
      console.error('Error categorizing categories:', error);
      toast({
        title: "Error",
        description: "Failed to organize categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
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
          <Button 
            variant="ghost" 
            onClick={() => setSelectedTag(null)}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to all tags
          </Button>
          <Badge variant="secondary" className="text-sm">
            {selectedTag} ({tagNotes.length})
          </Badge>
        </div>
        <div className="card-grid">
          {tagNotes.map(note => (
            <Card 
              key={note.id}
              className="note-card bg-secondary/50 border-border/10"
              onClick={() => navigate(`/note/${note.id}`)}
            >
              <CardHeader className="space-y-2">
                <h3 className="font-medium text-lg line-clamp-1">
                  {note.content.split('\n')[0]}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
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
      <div className="flex justify-between items-center gap-4">
        {shouldShowCategorizeButton() && (
          <Button 
            onClick={categorizeTags} 
            disabled={isLoading}
            variant="secondary"
            className="hover:bg-secondary/80"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Categorizing...
              </>
            ) : (
              "Categorize Tags"
            )}
          </Button>
        )}
        {savedCategories && (
          <Button
            onClick={categorizeCategories}
            disabled={isCategorizing}
            variant="secondary"
            className="hover:bg-secondary/80"
          >
            {isCategorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Organizing...
              </>
            ) : (
              "Organize Categories"
            )}
          </Button>
        )}
      </div>

      {Object.keys(lifeSections).length > 0 && (
        <div className="space-y-6">
          <h2 className="section-title">Life Sections</h2>
          <div className="card-grid">
            {Object.entries(lifeSections).map(([section, categories]) => (
              <Card key={section} className="category-card">
                <CardHeader className="p-4">
                  <h3 className="font-medium capitalize mb-3">{section}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Badge 
                        key={category}
                        variant="secondary"
                        className="capitalize tag-badge"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {savedCategories && (
        <div className="space-y-6">
          <h2 className="section-title">Categories and Tags</h2>
          <div className="card-grid">
            {Object.entries(savedCategories).map(([category, tags]) => (
              <Card key={category} className="category-card">
                <CardHeader className="p-4">
                  <h3 className="font-medium capitalize mb-3">{category.split(': ')[1]}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge 
                        key={tag}
                        className="tag-badge cursor-pointer"
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
        <div className="card-grid">
          {sortedTags.map(([tag, tagNotes]) => (
            <Card 
              key={tag}
              className="category-card cursor-pointer"
              onClick={() => setSelectedTag(tag)}
            >
              <CardHeader className="p-4 space-y-2">
                <Badge variant="secondary" className="tag-badge inline-block">
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
