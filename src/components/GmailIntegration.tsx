import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GmailIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/gmail-callback`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    window.location.href = url;
  };

  const handleFetchEmails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-emails', {});
      
      if (error) throw error;

      toast({
        title: 'Success',
        description: `${data.emails.length} emails fetched and queued for processing`,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch emails',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleConnect} variant="outline" className="gap-2">
        <Mail className="w-4 h-4" />
        Connect Gmail
      </Button>
      <Button onClick={handleFetchEmails} disabled={isLoading} variant="outline" className="gap-2">
        <Mail className="w-4 h-4" />
        {isLoading ? 'Fetching...' : 'Fetch Recent Emails'}
      </Button>
    </div>
  );
};