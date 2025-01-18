import { Card, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Link2Icon, ImageIcon, MailIcon, TextIcon } from "lucide-react";
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

  const getTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return <Link2Icon className="h-3 w-3" />;
      case 'image':
        return <ImageIcon className="h-3 w-3" />;
      case 'email':
        return <MailIcon className="h-3 w-3" />;
      default:
        return <TextIcon className="h-3 w-3" />;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'url':
        return 'URL Note';
      case 'image':
        return 'Image Note';
      case 'email':
        return 'Email Note';
      default:
        return 'Text Note';
    }
  };

  return (
    <Card 
      className="note-card cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate(`/note/${note.id}`)}
    >
      <CardHeader className="flex flex-col space-y-2 p-3 md:p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-secondary text-sm md:text-base">{title}</h3>
          <div className="flex items-center text-xs md:text-sm text-muted-foreground shrink-0">
            <CalendarIcon className="mr-1 h-3 w-3 md:h-4 md:w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{truncatedContent}</p>
        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="secondary"
            className="text-xs flex items-center gap-1"
          >
            {getTypeIcon(note.input_type)}
            {getTypeLabel(note.input_type)}
          </Badge>
          {note.tags.slice(1, 4).map(tag => (
            <Badge 
              key={tag}
              variant="outline"
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
};