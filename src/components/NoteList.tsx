import { NoteCard } from "./NoteCard";

interface Note {
  id: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  input_type?: string | null;
  source_url?: string | null;
  source_image_path?: string | null;
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

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {sortedNotes.map((note) => (
        <NoteCard 
          key={note.id} 
          note={{
            ...note,
            content: note.content || '',
            tags: note.tags || []
          }} 
        />
      ))}
    </div>
  );
};