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

interface LifeSections {
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

  // Extract life sections from category names
  const getLifeSections = (): LifeSections => {
    if (!savedCategories) return {};
    
    const sections: Record<string, string[]> = {};
    Object.entries(savedCategories).forEach(([category]) => {
      const [section, name] = category.split(': ');
      if (!sections[section]) {
        sections[section] = [];
      }
      if (name && !sections[section].includes(name)) {
        sections[section].push(name);
      }
    });
    return sections;
  };

  const lifeSections = getLifeSections();

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
      <div className="text-center text-secondary py-12">
        No tags yet. Start by adding some notes!
      </div>
    );
  }

  if (selectedTag) {
    const tagNotes = tagMap.get(selectedTag) || [];
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedTag(null)}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to all tags
          </Button>
          <Badge variant="outline" className="text-sm text-secondary">
            {selectedTag} ({tagNotes.length})
          </Badge>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tagNotes.map(note => (
            <Card 
              key={note.id}
              className="note-card bg-muted/50 border-border/10 cursor-pointer"
              onClick={() => navigate(`/note/${note.id}`)}
            >
              <CardHeader className="p-3 md:p-4 space-y-2">
                <h3 className="font-medium text-sm md:text-base text-secondary line-clamp-1">
                  {note.content.split('\n')[0]}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {shouldShowCategorizeButton() && (
          <Button 
            onClick={categorizeTags} 
            disabled={isLoading}
            variant="outline"
            className="text-sm"
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
            variant="outline"
            className="text-sm"
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
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-secondary">Life Sections</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(lifeSections).map(([section, categories]) => (
              <Card key={section} className="bg-muted/50 border-border/10">
                <CardHeader className="p-3 md:p-4">
                  <h3 className="font-medium capitalize text-secondary mb-2">{section}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(category => (
                      <Badge 
                        key={category}
                        variant="outline"
                        className="capitalize text-xs"
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
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-secondary">Categories and Tags</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(savedCategories).map(([category, tags]) => (
              <Card key={category} className="bg-muted/50 border-border/10">
                <CardHeader className="p-3 md:p-4">
                  <h3 className="font-medium capitalize text-secondary mb-2">{category.split(': ')[1]}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <Badge 
                        key={tag}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTags.map(([tag, tagNotes]) => (
            <Card 
              key={tag}
              className="bg-muted/50 border-border/10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => setSelectedTag(tag)}
            >
              <CardHeader className="p-3 md:p-4 space-y-2">
                <Badge variant="outline" className="text-xs inline-block">
                  {tag}
                </Badge>
                <p className="text-xs text-muted-foreground">
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