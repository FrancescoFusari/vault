import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { NetworkNode } from '@/utils/networkGraphUtils';
import { ScrollArea } from "@/components/ui/scroll-area";

interface GraphSearchProps {
  nodes: NetworkNode[];
  onNodeSelect: (nodeId: string) => void;
}

export const GraphSearch = ({ nodes, onNodeSelect }: GraphSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<NetworkNode[]>([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const searchResults = nodes.filter(node => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setResults(searchResults);
  }, [searchTerm, nodes]);

  return (
    <div className="absolute top-20 left-4 z-10 w-64">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-lg">
        <div className="p-2">
          <Input
            type="search"
            placeholder="Search nodes and tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        {results.length > 0 && (
          <ScrollArea className="h-[200px] w-full rounded-md">
            <div className="p-2">
              {results.map((node) => (
                <button
                  key={node.id}
                  onClick={() => {
                    onNodeSelect(node.id);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                >
                  <span className="font-medium">{node.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {node.type}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};