import { Note } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

interface NotePopoverProps {
  note: Note;
  onClose: () => void;
}

export const NotePopover = ({ note, onClose }: NotePopoverProps) => {
  const navigate = useNavigate();

  return (
    <PopoverContent className="w-80">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">
            {note.tags[0] || note.content.split('\n')[0].substring(0, 50) + (note.content.length > 50 ? '...' : '')}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(1).map(tag => (
            <Badge 
              key={tag}
              variant="outline"
              className="text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Button 
          className="w-full"
          onClick={() => {
            onClose();
            navigate(`/note/${note.id}`);
          }}
        >
          View Note
        </Button>
      </div>
    </PopoverContent>
  );
};