import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, FolderClosed, Hash, Menu, StickyNote, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useState } from "react";
import { Button } from "./ui/button";

interface Note {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface Categories {
  [key: string]: string[];
}

export const TagsSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="floating-sidebar mt-[84px]">
          <SidebarContentComponent />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-background/50 backdrop-blur-sm border-border/10"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div
          className={`fixed inset-y-0 left-0 w-[280px] bg-background/90 backdrop-blur-sm border-r border-border/10 transform transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto pt-16 pb-4">
            <SidebarContentComponent />
          </div>
        </div>
      </div>
    </>
  );
};

const SidebarContentComponent = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openTags, setOpenTags] = useState<Record<string, boolean>>({});
  
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    }
  });

  const { data: savedCategories } = useQuery({
    queryKey: ['tag-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('categories')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.categories as Categories | null;
    }
  });

  // Create a map of tags to notes
  const tagMap = new Map<string, Note[]>();
  notes.forEach(note => {
    note.tags.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)?.push(note);
    });
  });

  // Extract life sections from category names
  const getLifeSections = () => {
    if (!savedCategories) return {};
    
    const sections: Record<string, string[]> = {};
    Object.entries(savedCategories).forEach(([category, tags]) => {
      const [section, name] = category.split(': ');
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(name);
    });
    return sections;
  };

  const lifeSections = getLifeSections();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleTag = (tag: string) => {
    setOpenTags(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }));
  };

  return (
    <SidebarContent className="pt-4">
      <SidebarGroup>
        <SidebarGroupLabel className="text-secondary">Life Sections</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {Object.entries(lifeSections).map(([section, categories]) => (
              <Collapsible
                key={section}
                open={openSections[section]}
                onOpenChange={() => toggleSection(section)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full text-secondary hover:text-primary">
                    <ChevronRight className={`h-4 w-4 transition-transform ${openSections[section] ? 'rotate-90' : ''}`} />
                    <span className="capitalize">{section}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {categories.map(category => (
                      <Collapsible
                        key={category}
                        open={openCategories[`${section}:${category}`]}
                        onOpenChange={() => toggleCategory(`${section}:${category}`)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuSubButton className="pl-6 text-secondary/80 hover:text-primary">
                            <FolderClosed className="h-4 w-4" />
                            <span className="capitalize">{category}</span>
                          </SidebarMenuSubButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {savedCategories && savedCategories[`${section}: ${category}`]?.map(tag => (
                            <Collapsible
                              key={tag}
                              open={openTags[tag]}
                              onOpenChange={() => toggleTag(tag)}
                            >
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton className="pl-10 text-muted-foreground hover:text-primary">
                                  <Hash className="h-4 w-4" />
                                  <span>{tag}</span>
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                {tagMap.get(tag)?.map(note => (
                                  <SidebarMenuSubItem key={note.id}>
                                    <SidebarMenuSubButton 
                                      onClick={() => navigate(`/note/${note.id}`)}
                                      size="sm"
                                      className="pl-14 text-muted-foreground hover:text-primary"
                                    >
                                      <StickyNote className="h-3 w-3" />
                                      <span className="truncate">{note.content.split('\n')[0].substring(0, 30)}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};
