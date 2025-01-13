import { NoteCard } from "./NoteCard";

interface Note {
  id: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  input_type?: string;
  source_url?: string;
  source_image_path?: string;
}

interface NoteListProps {
  notes: Note[];
}

export const NoteList = ({ notes }: NoteListProps) => {
  // Add a safety check for notes
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No notes yet. Start by adding one above!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
};