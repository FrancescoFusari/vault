import { Input } from "@/components/ui/input";
import { NetworkNode } from "@/utils/networkGraphUtils";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { SearchResult } from "./SearchResult";

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

  const getRelatedNodes = (node: NetworkNode): NetworkNode[] => {
    // For tag nodes, find all notes that have this tag
    if (node.type === 'tag') {
      return nodes.filter(n => 
        n.type === 'note' && 
        node.connections?.includes(n.id)
      );
    }
    
    // For note nodes, find all connected tags and notes with common tags
    const connectedNodeIds = node.connections || [];
    const connectedNodes = nodes.filter(n => connectedNodeIds.includes(n.id));
    
    // Find notes that share tags with this note
    const noteTags = connectedNodes.filter(n => n.type === 'tag');
    const relatedNotes = nodes.filter(n => 
      n.type === 'note' && 
      n.id !== node.id && 
      noteTags.some(tag => n.connections?.includes(tag.id))
    );
    
    return [...connectedNodes, ...relatedNotes];
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
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
        <div className="mt-2">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {results.map((node) => (
                <SearchResult
                  key={node.id}
                  node={node}
                  relatedNodes={getRelatedNodes(node)}
                  onSelect={(selectedNode) => {
                    onNodeSelect(selectedNode);
                    if (selectedNode.id !== node.id) {
                      setSearchTerm("");
                    }
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};