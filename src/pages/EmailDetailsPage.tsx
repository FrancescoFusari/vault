import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const EmailDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_processing_queue')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="container mx-auto p-4 mt-16">
        <div className="text-center text-muted-foreground">
          Email not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:mt-16">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/queue')}
          className="group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Queue
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold break-words">{email.subject}</h2>
              <p className="text-muted-foreground mt-1">From: {email.sender}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Received: {format(new Date(email.received_at), "PPp")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Processing Status</h3>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                email.status === 'completed' ? 'bg-green-500' :
                email.status === 'error' ? 'bg-red-500' :
                email.status === 'processing' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`} />
              <span className="capitalize">{email.status}</span>
            </div>
          </div>

          {email.error_message && (
            <div className="bg-destructive/10 p-4 rounded-lg">
              <h3 className="font-semibold text-destructive mb-2">Error</h3>
              <p className="text-destructive text-sm">{email.error_message}</p>
            </div>
          )}

          {email.processed_at && (
            <div>
              <h3 className="font-semibold mb-2">Processed At</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(email.processed_at), "PPp")}
              </p>
            </div>
          )}

          {email.email_body && (
            <div>
              <h3 className="font-semibold mb-2">Email Content</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {email.email_body}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailDetailsPage;