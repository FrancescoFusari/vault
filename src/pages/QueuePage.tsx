import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

type QueueItem = {
  id: string;
  email_id: string;
  sender: string;
  subject: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  received_at: string;
  email_body: string | null;
  user_id: string;
};

type SenderStat = {
  sender: string;
  count: number;
};

const extractSenderName = (email: string) => {
  const nameMatch = email.match(/^([^<]+)</);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  return email.split('@')[0].split('.').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const QueuePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["queue-items"],
    queryFn: async () => {
      console.log("Fetching queue items...");
      const { data, error } = await supabase
        .from("email_processing_queue")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) {
        console.error("Error fetching queue items:", error);
        throw error;
      }

      console.log("Queue items fetched:", data);
      return data as QueueItem[];
    },
    refetchInterval: 5000,
  });

  const processEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Processing email:', emailId);
      const { data, error } = await supabase.functions.invoke('process-email-to-note', {
        body: { emailId, userId: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, emailId) => {
      queryClient.invalidateQueries({ queryKey: ["queue-items"] });
      toast({
        title: "Email processed successfully",
        description: "The email has been converted to a note",
      });
      navigate(`/note/${data.note.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error processing email",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const senderStats = useMemo(() => {
    if (!queueItems) return [];
    
    const stats: Record<string, number> = {};
    queueItems.forEach(item => {
      const senderName = extractSenderName(item.sender);
      stats[senderName] = (stats[senderName] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count);
  }, [queueItems]);

  const filteredQueueItems = useMemo(() => {
    if (!queueItems) return [];
    
    let filtered = queueItems;
    
    if (selectedSender) {
      filtered = filtered.filter(item => 
        extractSenderName(item.sender) === selectedSender
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.sender.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.email_body && item.email_body.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [queueItems, searchQuery, selectedSender]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderMobileCard = (item: QueueItem) => (
    <Card 
      key={item.id}
      className="mb-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/email/${item.id}`)}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium line-clamp-2">{item.subject}</h3>
            <Badge className={getStatusBadgeColor(item.status)}>
              {item.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            From: {extractSenderName(item.sender)}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(item.received_at), "PPp")}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              processEmailMutation.mutate(item.id);
            }}
            disabled={
              item.status === 'completed' || 
              processEmailMutation.isPending && 
              processEmailMutation.variables === item.id
            }
            className="w-full"
          >
            {processEmailMutation.isPending && processEmailMutation.variables === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Process Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto p-4 md:mt-16">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-semibold">Processing Queue</h1>
        
        {/* Sender Statistics */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Senders</h2>
          <div className="flex flex-wrap gap-2">
            {senderStats.slice(0, 5).map(({ sender, count }) => (
              <Badge 
                key={sender} 
                variant={selectedSender === sender ? "default" : "secondary"}
                className="text-sm py-1 cursor-pointer"
                onClick={() => setSelectedSender(sender)}
              >
                {sender} ({count})
              </Badge>
            ))}
            {senderStats.length > 5 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 px-2 text-sm"
                  >
                    +{senderStats.length - 5} more
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    {senderStats.slice(5).map(({ sender, count }) => (
                      <Badge 
                        key={sender} 
                        variant={selectedSender === sender ? "default" : "secondary"}
                        className="text-sm py-1 cursor-pointer"
                        onClick={() => setSelectedSender(sender)}
                      >
                        {sender} ({count})
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>

        {/* Active Filter Display */}
        {selectedSender && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtering by sender:</span>
            <Badge 
              variant="outline" 
              className="flex items-center gap-1"
            >
              {selectedSender}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedSender(null)}
              />
            </Badge>
          </div>
        )}

        {/* Search Bar */}
        <div>
          <Input
            type="text"
            placeholder="Search by sender, subject, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Queue Items List */}
        {isMobile ? (
          <div className="space-y-4">
            {filteredQueueItems.map(renderMobileCard)}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received At</TableHead>
                  <TableHead>Processed At</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueueItems.map((item) => (
                  <TableRow 
                    key={item.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell 
                      className="font-medium cursor-pointer" 
                      onClick={() => navigate(`/email/${item.id}`)}
                    >
                      {item.subject}
                    </TableCell>
                    <TableCell>{extractSenderName(item.sender)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.received_at), "PPp")}
                    </TableCell>
                    <TableCell>
                      {item.processed_at
                        ? format(new Date(item.processed_at), "PPp")
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {item.error_message || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => processEmailMutation.mutate(item.id)}
                        disabled={
                          item.status === 'completed' || 
                          processEmailMutation.isPending && 
                          processEmailMutation.variables === item.id
                        }
                      >
                        {processEmailMutation.isPending && processEmailMutation.variables === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Process
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePage;
