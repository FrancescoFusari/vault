import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface NoteInputProps {
  onNoteSubmit: (note: string) => Promise<void>;
}

export const NoteInput = ({ onNoteSubmit }: NoteInputProps) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
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
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto p-6 rounded-lg border border-border bg-card shadow-sm">
      <Textarea
        placeholder="Write your note here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[200px] text-lg bg-background resize-none focus:ring-1 focus:ring-primary/20 transition-all"
      />
      <Button 
        onClick={handleSubmit} 
        className="w-full h-12 text-base font-normal"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Add Note'
        )}
      </Button>
    </div>
  );
};