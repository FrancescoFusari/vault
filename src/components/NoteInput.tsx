import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Link2Icon, Type, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NoteInputProps {
  onNoteSubmit: (note: string) => Promise<void>;
}

export const NoteInput = ({ onNoteSubmit }: NoteInputProps) => {
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (isImageMode) {
      // Image mode is handled by the file input's onChange
      return;
    }

    if (isUrlMode) {
      if (!url.trim()) {
        toast({
          title: "URL cannot be empty",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const { data, error } = await supabase.functions.invoke('process-url', {
          body: { url }
        });

        if (error) throw error;

        setUrl('');
        toast({
          title: "URL processed successfully",
          description: "The content has been added to your notes",
        });
      } catch (error) {
        console.error('Error processing URL:', error);
        toast({
          title: "Failed to process URL",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!note.trim()) {
        toast({
          title: "Note cannot be empty",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await onNoteSubmit(note);
        setNote('');
        toast({
          title: "Note added successfully",
          description: "Your note has been processed and categorized",
        });
      } catch (error) {
        toast({
          title: "Failed to add note",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const { data, error } = await supabase.functions.invoke('process-image', {
        body: {
          image: base64Data,
          filename: file.name,
          contentType: file.type
        }
      });

      if (error) throw error;

      toast({
        title: "Image processed successfully",
        description: "The image has been analyzed and added to your notes",
      });

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Failed to process image",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm transition-all">
        <div className="flex gap-1 p-2 border-b border-border/50">
          <Button
            variant={!isUrlMode && !isImageMode ? "secondary" : "ghost"}
            onClick={() => {
              setIsUrlMode(false);
              setIsImageMode(false);
            }}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <Type className="w-3.5 h-3.5 mr-1.5" />
            Text
          </Button>
          <Button
            variant={isUrlMode ? "secondary" : "ghost"}
            onClick={() => {
              setIsUrlMode(true);
              setIsImageMode(false);
            }}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <Link2Icon className="w-3.5 h-3.5 mr-1.5" />
            URL
          </Button>
          <Button
            variant={isImageMode ? "secondary" : "ghost"}
            onClick={() => {
              setIsUrlMode(false);
              setIsImageMode(true);
            }}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Image
          </Button>
        </div>

        <div className="p-4">
          {isImageMode ? (
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isSubmitting}
              className="text-sm bg-background/50"
            />
          ) : isUrlMode ? (
            <Input
              placeholder="Enter URL to process..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-sm bg-background/50"
              type="url"
            />
          ) : (
            <Textarea
              placeholder="Write your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[180px] text-sm bg-background/50 resize-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
            />
          )}

          {!isImageMode && (
            <Button 
              onClick={handleSubmit} 
              className="w-full h-9 text-sm font-normal mt-4"
              disabled={isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {isUrlMode ? 'Processing URL...' : 'Processing...'}
                </>
              ) : (
                isUrlMode ? 'Process URL' : 'Add Note'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};