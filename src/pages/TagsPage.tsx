import { TagView } from "@/components/TagView";
import { TagsSidebar } from "@/components/TagsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const TagsPage = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TagsSidebar />
        <div className="flex-1">
          <div className="container mx-auto py-8">
            <h1 className="text-2xl font-semibold">Tags Overview</h1>
            <TagView />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TagsPage;