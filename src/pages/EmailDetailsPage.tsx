import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const EmailDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
    return <div className="container mx-auto p-4">Email not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/queue')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Queue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{email.subject}</h2>
              <p className="text-muted-foreground">From: {email.sender}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(email.received_at), "PPp")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
              <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
              <p className="text-red-600 dark:text-red-400">{email.error_message}</p>
            </div>
          )}

          {email.processed_at && (
            <div>
              <h3 className="font-semibold mb-2">Processed At</h3>
              <p>{format(new Date(email.processed_at), "PPp")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailDetailsPage;