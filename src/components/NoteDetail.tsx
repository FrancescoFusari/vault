import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, X, Link2Icon, ImageIcon, MailIcon, TextIcon } from "lucide-react";
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
    input_type?: string;
    source_image_path?: string;
    metadata?: {
      technical_details?: string;
      visual_elements?: string[];
      color_palette?: string[];
      composition_notes?: string;
      estimated_date_or_period?: string;
    };
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

  const imageUrl = note.source_image_path 
    ? supabase.storage.from('note_images').getPublicUrl(note.source_image_path).data.publicUrl
    : null;

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return <Link2Icon className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'email':
        return <MailIcon className="h-4 w-4" />;
      default:
        return <TextIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return 'URL Note';
      case 'image':
        return 'Image Note';
      case 'email':
        return 'Email Note';
      default:
        return 'Text Note';
    }
  };

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
            <Badge 
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getTypeIcon(note.input_type)}
              {getTypeLabel(note.input_type)}
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
          
          {note.metadata && (
            <div className="space-y-4 mb-6 bg-muted p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Image Analysis</h3>
              
              {note.metadata.technical_details && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Technical Details</h4>
                  <p>{note.metadata.technical_details}</p>
                </div>
              )}
              
              {note.metadata.visual_elements && note.metadata.visual_elements.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Visual Elements</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.metadata.visual_elements.map((element, index) => (
                      <Badge key={index} variant="secondary">{element}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.metadata.color_palette && note.metadata.color_palette.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Color Palette</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.metadata.color_palette.map((color, index) => (
                      <Badge key={index} variant="outline">{color}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {note.metadata.composition_notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Composition Notes</h4>
                  <p>{note.metadata.composition_notes}</p>
                </div>
              )}
              
              {note.metadata.estimated_date_or_period && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Estimated Period</h4>
                  <p>{note.metadata.estimated_date_or_period}</p>
                </div>
              )}
            </div>
          )}
          
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
