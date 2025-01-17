import { useState } from "react";
import { NetworkNode } from "@/utils/networkGraphUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultProps {
  node: NetworkNode;
  relatedNodes: NetworkNode[];
  onSelect: (node: NetworkNode) => void;
}

export const SearchResult = ({ node, relatedNodes, onSelect }: SearchResultProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const relatedTags = relatedNodes.filter(n => n.type === 'tag');
  const relatedNotes = relatedNodes.filter(n => n.type === 'note');

  return (
    <div 
      className={cn(
        "bg-background/95 backdrop-blur-sm border rounded-lg transition-all duration-200",
        isExpanded ? "p-4" : "p-3"
      )}
    >
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex-1 justify-start font-medium truncate"
          onClick={handleSelect}
        >
          {node.name}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="ml-2"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {relatedTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Tag className="h-4 w-4 mr-2" />
                Connected Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => onSelect(tag)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {relatedNotes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Notes with Common Tags
              </div>
              <div className="space-y-1">
                {relatedNotes.map((note) => (
                  <Button
                    key={note.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm font-normal"
                    onClick={() => onSelect(note)}
                  >
                    {note.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};