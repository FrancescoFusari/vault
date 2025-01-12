import { Card, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Link2Icon, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    tags: string[];
    created_at: string;
    input_type?: string;
    source_url?: string;
    source_image_path?: string;
  };
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const navigate = useNavigate();
  
  // Get first 18 words of content
  const truncatedContent = note.content
    .split(' ')
    .slice(0, 18)
    .join(' ') + (note.content.split(' ').length > 18 ? '...' : '');

  // Use first tag as title, or first line of content if no tags
  const title = note.tags[0] || note.content.split('\n')[0].substring(0, 50) + (note.content.length > 50 ? '...' : '');

  return (
    <Card 
      className="note-card cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate(`/note/${note.id}`)}
    >
      <CardHeader className="flex flex-col space-y-2 py-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{title}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{truncatedContent}</p>
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(1, 4).map(tag => (
            <Badge 
              key={tag}
              variant="outline"
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
          {note.source_url && (
            <Badge 
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <Link2Icon className="h-3 w-3" />
              URL
            </Badge>
          )}
          {note.source_image_path && (
            <Badge 
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <ImageIcon className="h-3 w-3" />
              Image
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};