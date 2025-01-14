import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GmailPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnection();
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_integrations')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setIsConnected(!!data);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGmailConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('gmail-auth', {
        body: { action: 'get-auth-url' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error initiating Gmail connection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to Gmail. Please try again.",
      });
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('gmail_integrations')
        .delete()
        .is('user_id', 'not', null);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: "Gmail disconnected",
        description: "Your Gmail account has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disconnect Gmail. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gmail Integration</h1>
      
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Mail className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Gmail Connection</h2>
              <p className="text-muted-foreground">
                {isConnected 
                  ? "Your Gmail account is connected" 
                  : "Connect your Gmail account to import emails"}
              </p>
            </div>
          </div>
          
          <Button
            variant={isConnected ? "destructive" : "default"}
            onClick={isConnected ? handleGmailDisconnect : handleGmailConnect}
          >
            {isConnected ? "Disconnect" : "Connect Gmail"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GmailPage;