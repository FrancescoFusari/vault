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
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/functions/v1/process-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

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
    <div className="space-y-6 w-full max-w-2xl mx-auto p-6 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex gap-2">
        <Button
          variant={!isUrlMode && !isImageMode ? "secondary" : "ghost"}
          onClick={() => {
            setIsUrlMode(false);
            setIsImageMode(false);
          }}
          className="flex-1"
        >
          <Type className="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button
          variant={isUrlMode ? "secondary" : "ghost"}
          onClick={() => {
            setIsUrlMode(true);
            setIsImageMode(false);
          }}
          className="flex-1"
        >
          <Link2Icon className="w-4 h-4 mr-2" />
          URL
        </Button>
        <Button
          variant={isImageMode ? "secondary" : "ghost"}
          onClick={() => {
            setIsUrlMode(false);
            setIsImageMode(true);
          }}
          className="flex-1"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Image
        </Button>
      </div>

      {isImageMode ? (
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isSubmitting}
          className="text-lg bg-background"
        />
      ) : isUrlMode ? (
        <Input
          placeholder="Enter URL to process..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-lg bg-background"
          type="url"
        />
      ) : (
        <Textarea
          placeholder="Write your note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[200px] text-lg bg-background resize-none focus:ring-1 focus:ring-primary/20 transition-all"
        />
      )}

      {!isImageMode && (
        <Button 
          onClick={handleSubmit} 
          className="w-full h-12 text-base font-normal"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUrlMode ? 'Processing URL...' : 'Processing...'}
            </>
          ) : (
            isUrlMode ? 'Process URL' : 'Add Note'
          )}
        </Button>
      )}
    </div>
  );
};