import { useQuery } from "@tanstack/react-query";
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

const QueuePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["queue-items"],
    queryFn: async () => {
      console.log("Fetching queue items...");
      const { data, error } = await supabase
        .from("email_processing_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching queue items:", error);
        throw error;
      }

      console.log("Queue items fetched:", data);
      return data as QueueItem[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Calculate sender statistics
  const senderStats = useMemo(() => {
    if (!queueItems) return [];
    
    const stats: Record<string, number> = {};
    queueItems.forEach(item => {
      stats[item.sender] = (stats[item.sender] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([sender, count]) => ({ sender, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Show top 5 senders
  }, [queueItems]);

  // Filter queue items based on search query
  const filteredQueueItems = useMemo(() => {
    if (!queueItems) return [];
    if (!searchQuery) return queueItems;

    const query = searchQuery.toLowerCase();
    return queueItems.filter(item => 
      item.sender.toLowerCase().includes(query) ||
      item.subject.toLowerCase().includes(query) ||
      (item.email_body && item.email_body.toLowerCase().includes(query))
    );
  }, [queueItems, searchQuery]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading queue items...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Processing Queue</h1>
      
      {/* Sender Statistics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Top Senders</h2>
        <div className="flex flex-wrap gap-3">
          {senderStats.map(({ sender, count }) => (
            <Badge 
              key={sender} 
              variant="secondary"
              className="text-sm py-1"
            >
              {sender} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by sender, subject, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Queue Items Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueueItems.map((item) => (
              <TableRow 
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/email/${item.id}`)}
              >
                <TableCell className="font-medium">{item.subject}</TableCell>
                <TableCell>{item.sender}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(item.created_at), "PPp")}
                </TableCell>
                <TableCell>
                  {item.processed_at
                    ? format(new Date(item.processed_at), "PPp")
                    : "-"}
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {item.error_message || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QueuePage;