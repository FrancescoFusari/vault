import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarIcon } from "@radix-ui/react-icons";
import { NoteGraph } from "./NoteGraph";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface NoteDetailProps {
  note: {
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
  };
  allNotes: Array<{
    id: string;
    content: string;
    category: string;
    tags: string[];
    created_at: string;
  }>;
}

export const NoteDetail = ({ note, allNotes }: NoteDetailProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-primary">
              {note.category}
            </Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {new Date(note.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap mb-4">{note.content}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">Knowledge Graph</h2>
        <NoteGraph notes={allNotes} highlightedNoteId={note.id} />
      </div>
    </div>
  );
};