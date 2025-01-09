import { Card, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    created_at: string;
  };
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const navigate = useNavigate();
  const title = note.content.split('\n')[0].substring(0, 50) + (note.content.length > 50 ? '...' : '');

  return (
    <Card 
      className="note-card cursor-pointer hover:bg-accent transition-colors"
      onClick={() => navigate(`/note/${note.id}`)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarIcon className="mr-1 h-4 w-4" />
          {new Date(note.created_at).toLocaleDateString()}
        </div>
      </CardHeader>
    </Card>
  );
};