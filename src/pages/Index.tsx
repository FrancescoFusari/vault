import { useState, useEffect } from "react";
import { NoteInput } from "@/components/NoteInput";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { analyzeNote } from "@/lib/openai";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleNoteSubmit = async (content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const analysis = await analyzeNote(content);
      
      const { error } = await supabase
        .from('notes')
        .insert({
          content,
          category: analysis.category,
          tags: analysis.tags,
          user_id: session.user.id
        });

      if (error) throw error;
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
    <div className="container mx-auto min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-primary">Smart Notes</h1>
          <p className="text-muted-foreground">
            Write notes and let AI categorize them for you
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <NoteInput onNoteSubmit={handleNoteSubmit} />
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Index;