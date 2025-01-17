import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { format } from "date-fns";

type QueueItem = {
  id: string;
  input_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  content: string | null;
  source_url: string | null;
  source_image_path: string | null;
};

const QueuePage = () => {
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["queue-items"],
    queryFn: async () => {
      console.log("Fetching queue items...");
      const { data, error } = await supabase
        .from("batch_processing_queue")
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queueItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.input_type}</TableCell>
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