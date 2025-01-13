import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { Input } from "./ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface NoteDetailProps {
  note: {
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
    source_image_path?: string;
  };
}

export const NoteDetail = ({ note }: NoteDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingTags, setIsRegeneratingTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<{ original: string; new: string } | null>(null);

  // Get the public URL for the image if it exists
  const imageUrl = note.source_image_path 
    ? supabase.storage.from('note_images').getPublicUrl(note.source_image_path).data.publicUrl
    : null;

  const updateNoteMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const { error } = await supabase
        .from('notes')
        .update({ tags })
        .eq('id', note.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Tags updated",
        description: "The note's tags have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating tags:', error);
      toast({
        title: "Error",
        description: "Failed to update tags. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...note.tags, newTag.trim()];
    updateNoteMutation.mutate(updatedTags);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter(tag => tag !== tagToRemove);
    updateNoteMutation.mutate(updatedTags);
  };

  const handleRenameTag = (originalTag: string) => {
    if (!editingTag || !editingTag.new.trim() || editingTag.new === originalTag) {
      setEditingTag(null);
      return;
    }

    const updatedTags = note.tags.map(tag => 
      tag === originalTag ? editingTag.new.trim() : tag
    );
    updateNoteMutation.mutate(updatedTags);
    setEditingTag(null);
  };

  const regenerateMetadata = async (type: 'tags' | 'title') => {
    try {
      const loadingState = type === 'tags' ? setIsRegeneratingTags : setIsRegeneratingTitle;
      loadingState(true);

      const { data: updatedNote, error } = await supabase.functions.invoke('regenerate-note-metadata', {
        body: { 
          content: note.content,
          noteId: note.id,
          type
        }
      });

      if (error) throw error;

      toast({
        title: `${type === 'tags' ? 'Tags' : 'Title'} regenerated`,
        description: "The note has been updated successfully.",
      });

      // Refresh the page to show the updated note
      window.location.reload();
    } catch (error) {
      console.error('Error regenerating metadata:', error);
      toast({
        title: "Error",
        description: `Failed to regenerate ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      const loadingState = type === 'tags' ? setIsRegeneratingTags : setIsRegeneratingTitle;
      loadingState(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-primary text-lg font-semibold">
              {note.category}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => regenerateMetadata('title')}
              disabled={isRegeneratingTitle}
            >
              <RefreshCw className={`h-4 w-4 ${isRegeneratingTitle ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          {imageUrl && (
            <div className="mb-6">
              <img 
                src={imageUrl} 
                alt="Note source" 
                className="rounded-lg max-h-96 w-full object-cover"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap mb-4">{note.content}</p>
          
          {/* Tag Management Section */}
          <div className="space-y-4">
            {/* Add New Tag */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add new tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="max-w-[200px]"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags List */}
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <div key={tag} className="flex items-center">
                  {editingTag?.original === tag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingTag.new}
                        onChange={(e) => setEditingTag({ ...editingTag, new: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameTag(tag)}
                        className="h-7 w-[150px]"
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRenameTag(tag)}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="secondary"
                      className="pr-1"
                    >
                      <span 
                        className="cursor-pointer mr-2"
                        onClick={() => setEditingTag({ original: tag, new: tag })}
                      >
                        {tag}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => regenerateMetadata('tags')}
                disabled={isRegeneratingTags}
              >
                <RefreshCw className={`h-4 w-4 ${isRegeneratingTags ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};