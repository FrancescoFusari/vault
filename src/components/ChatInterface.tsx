import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  noteContent: string;
  noteId: string;
}

export const ChatInterface = ({ noteContent, noteId }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Get current user's ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch existing messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', noteId],
    queryFn: async () => {
      console.log('Fetching messages for note:', noteId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', data);
      return data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    }
  });

  const handleSend = async () => {
    if (!message.trim() || isLoading || !userId) return;

    const userMessage = { role: 'user' as const, content: message };
    setIsLoading(true);

    try {
      console.log('Sending message with note content:', { message, noteContentLength: noteContent?.length });
      
      // Save user message
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          note_id: noteId,
          user_id: userId,
          role: 'user',
          content: message
        });

      if (insertError) throw insertError;

      // Get AI response
      const { data, error } = await supabase.functions.invoke('chat-with-note', {
        body: { message, noteContent }
      });

      if (error) throw error;

      console.log('Received response:', data);

      // Save assistant message
      const { error: assistantInsertError } = await supabase
        .from('chat_messages')
        .insert({
          note_id: noteId,
          user_id: userId,
          role: 'assistant',
          content: data.reply
        });

      if (assistantInsertError) throw assistantInsertError;

      // Refresh messages
      refetchMessages();
      setMessage('');
    } catch (error) {
      console.error('Error in chat flow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && isMobile) {
    return (
      <Button
        className="fixed bottom-24 right-4 md:bottom-4 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        Start Chat
      </Button>
    );
  }

  const chatContent = (
    <div className={`${isMobile ? 'fixed bottom-24 right-4 w-[90vw] max-w-[400px]' : 'h-full'} bg-background border rounded-lg shadow-lg`}>
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Chat about this note</h3>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className={`${isMobile ? 'h-[300px]' : 'h-[calc(100vh-13rem)]'} p-4`}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  return isMobile ? chatContent : (
    <div className="h-full sticky top-20">
      {chatContent}
    </div>
  );
};