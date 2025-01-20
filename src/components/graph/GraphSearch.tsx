import { Input } from "@/components/ui/input";
import { NetworkNode } from "@/utils/networkGraphUtils";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface GraphSearchProps {
  nodes: NetworkNode[];
  onNodeSelect: (node: NetworkNode) => void;
}

export const GraphSearch = ({ nodes, onNodeSelect }: GraphSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<NetworkNode[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const filtered = nodes.filter((node) => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filtered);
  }, [searchTerm, nodes]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-10">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search nodes and tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {results.length > 0 && (
        <div className="mt-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg">
          <ScrollArea className="h-[min(300px,60vh)] rounded-lg">
            <div className="p-2 space-y-1">
              {results.map((node) => (
                <Button
                  key={node.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => {
                    onNodeSelect(node);
                    setSearchTerm("");
                  }}
                >
                  <span className="truncate">
                    {node.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({node.type})
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};