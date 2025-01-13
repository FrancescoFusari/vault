import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  noteContent: string;
}

export const ChatInterface = ({ noteContent }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message with note content:', { message, noteContentLength: noteContent?.length });
      
      const { data, error } = await supabase.functions.invoke('chat-with-note', {
        body: { message, noteContent }
      });

      if (error) throw error;

      console.log('Received response:', data);

      const assistantMessage = { role: 'assistant' as const, content: data.reply };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
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