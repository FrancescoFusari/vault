import { NoteInput } from "@/components/NoteInput";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { analyzeNote } from "@/lib/openai";
import { GmailIntegration } from "@/components/GmailIntegration";
import { Github, Mail, X, MessageSquare, Linkedin, Facebook, Instagram, Youtube, BookOpen, Cloud, Notebook } from "lucide-react";

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

  const handleServiceClick = (service: string) => {
    console.log(`Clicked ${service} integration`);
    // Implementation will be added later
  };

  return (
    <div className="container mx-auto min-h-screen flex flex-col bg-background">
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground transition-colors"
          size="icon"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            Entrance to the vault
          </h1>
          <p className="text-muted-foreground text-lg">
            Drop anything, we'll add tags and categorize it
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto space-y-12">
          <NoteInput onNoteSubmit={handleNoteSubmit} />
          
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-medium text-foreground mb-2">Connect services</h2>
              <p className="text-sm text-muted-foreground">Import your data from other platforms</p>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 p-6 rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-col items-center gap-2">
                <GmailIntegration />
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('github')}
                >
                  <Github className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">GitHub</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('gmail')}
                >
                  <Mail className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Gmail</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('x')}
                >
                  <X className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">X</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('threads')}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Threads</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('linkedin')}
                >
                  <Linkedin className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">LinkedIn</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('facebook')}
                >
                  <Facebook className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Facebook</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('instagram')}
                >
                  <Instagram className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Instagram</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('youtube')}
                >
                  <Youtube className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">YouTube</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('notion')}
                >
                  <Notebook className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Notion</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('obsidian')}
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Obsidian</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square rounded-xl hover:bg-secondary"
                  onClick={() => handleServiceClick('google-drive')}
                >
                  <Cloud className="h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">Drive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
