import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Link2Icon, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NoteInputProps {
  onNoteSubmit: (note: string) => Promise<void>;
}

export const NoteInput = ({ onNoteSubmit }: NoteInputProps) => {
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
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

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto p-6 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex gap-2">
        <Button
          variant={isUrlMode ? "ghost" : "secondary"}
          onClick={() => setIsUrlMode(false)}
          className="flex-1"
        >
          <Type className="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button
          variant={isUrlMode ? "secondary" : "ghost"}
          onClick={() => setIsUrlMode(true)}
          className="flex-1"
        >
          <Link2Icon className="w-4 h-4 mr-2" />
          URL
        </Button>
      </div>

      {isUrlMode ? (
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
    </div>
  );
};