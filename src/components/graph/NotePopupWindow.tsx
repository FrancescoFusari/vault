import { Note } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface NotePopupWindowProps {
  note: Note;
  onClose: () => void;
}

export const NotePopupWindow = ({ note, onClose }: NotePopupWindowProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">
          {note.tags[0] || note.content.split('\n')[0]}
        </h2>
        <div className="flex flex-wrap gap-2">
          {note.tags.slice(1).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              navigate(`/note/${note.id}`);
              onClose();
            }}
          >
            View Note
          </Button>
        </div>
      </div>
    </div>
  );
};