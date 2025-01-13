import { NoteList } from "@/components/NoteList";
import { BottomNav } from "@/components/BottomNav";
import { TagsSidebar } from "@/components/TagsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const NotesListPage = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TagsSidebar />
        <div className="flex-1">
          <div className="container mx-auto py-8">
            <h1 className="text-2xl font-semibold">Vault</h1>
            <NoteList />
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default NotesListPage;