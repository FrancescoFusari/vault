import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GmailIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      console.log('Initiating Gmail connection...');
      
      // Get the client ID from Supabase edge function
      const { data, error: clientIdError } = await supabase.functions.invoke('gmail-auth', {
        body: { action: 'get_client_id' }
      });
      
      if (clientIdError) {
        console.error('Error getting client ID:', clientIdError);
        throw new Error(`Failed to get client ID: ${clientIdError.message}`);
      }

      console.log('Successfully got client ID');
      
      const redirectUri = `${window.location.origin}/gmail-callback`;
      const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
      
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${data.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      console.log('Redirecting to Google OAuth URL:', url);
      window.location.href = url;
    } catch (error) {
      console.error('Error initiating Gmail connection:', error);
      toast({
        title: 'Error',
        description: `Failed to connect to Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleFetchEmails = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching emails...');
      const { data, error } = await supabase.functions.invoke('fetch-emails', {});
      
      if (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }

      console.log('Emails fetched successfully:', data);
      toast({
        title: 'Success',
        description: `${data.emails.length} emails fetched and queued for processing`,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch emails: ${error instanceof Error ? error.message : String(error)}`,
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