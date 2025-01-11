import { TagView } from "@/components/TagView";
import { BottomNav } from "@/components/BottomNav";
import { TagsSidebar } from "@/components/TagsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const TagsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <TagsSidebar />
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>Tags Overview</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100vh-4rem)]">
              <TagsSidebar />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1">
          <div className="container mx-auto py-8 space-y-8">
            {/* Mobile Toggle Button */}
            <div className="flex items-center gap-4 md:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <h1 className="text-2xl font-semibold">Tags Overview</h1>
            </div>
            
            {/* Desktop Title */}
            <h1 className="text-2xl font-semibold hidden md:block">Tags Overview</h1>
            
            <TagView />
            <BottomNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TagsPage;