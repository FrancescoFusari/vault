import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const GmailCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(location.search).get('code');
      
      if (!code) {
        toast({
          title: 'Error',
          description: 'No authorization code received',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      try {
        const { error } = await supabase.functions.invoke('gmail-auth', {
          body: { code, action: 'exchange_code' }
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Gmail account connected successfully',
        });
      } catch (error) {
        console.error('Error connecting Gmail:', error);
        toast({
          title: 'Error',
          description: 'Failed to connect Gmail account',
          variant: 'destructive',
        });
      }

      navigate('/');
    };

    handleCallback();
  }, [location.search, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connecting Gmail...</h1>
        <p className="text-muted-foreground">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
};

export default GmailCallback;