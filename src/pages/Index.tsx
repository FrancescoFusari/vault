import { NoteInput } from "@/components/NoteInput";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { analyzeNote } from "@/lib/openai";

const Index = () => {
  const navigate = useNavigate();

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
    <div className="container mx-auto min-h-screen flex flex-col bg-background">
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign Out
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center -mt-20 px-4">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Entrance to the vault
          </h1>
          <p className="text-muted-foreground text-lg">
            Drop anything, we'll add tags and categorize it
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