import { NoteInput } from "@/components/NoteInput";
import { supabase } from "@/integrations/supabase/client";
import { analyzeNote } from "@/lib/openai";
import { GmailIntegration } from "@/components/GmailIntegration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Waves } from "@/components/ui/waves-background";

const Index = () => {
  const isMobile = useIsMobile();

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

  return (
    <>
      <Waves
        lineColor="rgba(239, 114, 52, 0.2)"
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
        className="fixed inset-0 pointer-events-none"
      />
      
      <div className="container mx-auto min-h-screen flex flex-col bg-transparent relative">      
        <div className="flex-1 flex flex-col items-center justify-center -mt-20 relative z-10">
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Entrance to the vault
            </h1>
            <p className="text-muted-foreground text-base">
              Drop anything, we'll add tags and categorize it
            </p>
          </div>
          
          <div className="w-full max-w-2xl mx-auto space-y-8">
            <NoteInput onNoteSubmit={handleNoteSubmit} />
            
            {/* Gmail Integration Section */}
            <div className="space-y-4">
              <div className="text-center">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-medium text-foreground mb-2`}>
                  Gmail Integration
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add your emails to the Vault
                </p>
              </div>
              <div className="flex justify-center">
                <GmailIntegration />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;