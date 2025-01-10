import { useState, useEffect } from "react";
import { NoteInput } from "@/components/NoteInput";
import { NoteList } from "@/components/NoteList";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { TagView } from "@/components/TagView";
import { analyzeNote } from "@/lib/openai";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface Note {
  id: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

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
      refetch();
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
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="tags">Tags View</TabsTrigger>
          <TabsTrigger value="network">Network View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-6">Your Notes</h2>
            <NoteList notes={notes} />
          </div>
        </TabsContent>
        <TabsContent value="tags">
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-6">Tags Overview</h2>
            <TagView />
          </div>
        </TabsContent>
        <TabsContent value="network">
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-6">Network View</h2>
            <NetworkGraph notes={notes} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;