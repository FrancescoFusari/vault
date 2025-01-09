import { useState } from "react";
import { NoteInput } from "@/components/NoteInput";
import { NoteList } from "@/components/NoteList";
import { analyzeNote } from "@/lib/openai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Note {
  id: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [apiKey, setApiKey] = useState('');

  const handleNoteSubmit = async (content: string) => {
    if (!apiKey) {
      throw new Error('Please enter your OpenAI API key');
    }

    const analysis = await analyzeNote(content, apiKey);
    
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      category: analysis.category,
      tags: analysis.tags,
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Smart Notes</h1>
        <p className="text-muted-foreground">
          Write notes and let AI categorize them for you
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <Label htmlFor="apiKey">OpenAI API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <NoteInput onNoteSubmit={handleNoteSubmit} />
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Your Notes</h2>
        <NoteList notes={notes} />
      </div>
    </div>
  );
};

export default Index;