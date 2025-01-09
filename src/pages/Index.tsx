import { useState } from "react";
import { NoteInput } from "@/components/NoteInput";
import { NoteList } from "@/components/NoteList";
import { analyzeNote } from "@/lib/openai";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Note {
  id: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();

  const { data: notes = [], refetch } = useQuery({
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

  const handleNoteSubmit = async (content: string) => {
    try {
      const analysis = await analyzeNote(content);
      
      const { error } = await supabase
        .from('notes')
        .insert({
          content,
          category: analysis.category,
          tags: analysis.tags,
        });

      if (error) throw error;
      refetch(); // Refresh the notes list
    } catch (error) {
      console.error('Error saving note:', error);
      throw new Error('Failed to save note. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Smart Notes</h1>
          <p className="text-muted-foreground">
            Write notes and let AI categorize them for you
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <NoteInput onNoteSubmit={handleNoteSubmit} />
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Your Notes</h2>
        <NoteList notes={notes} />
      </div>
    </div>
  );
};

export default Index;