import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, FolderClosed, Hash, StickyNote } from "lucide-react";
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
  const navigate = useNavigate();
  
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Life Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(lifeSections).map(([section, categories]) => (
                <SidebarMenuItem key={section}>
                  <SidebarMenuButton>
                    <ChevronRight className="h-4 w-4" />
                    <span className="capitalize">{section}</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {categories.map(category => (
                      <SidebarMenuSubItem key={category}>
                        <SidebarMenuSubButton>
                          <FolderClosed className="h-4 w-4" />
                          <span className="capitalize">{category}</span>
                        </SidebarMenuSubButton>
                        {savedCategories && savedCategories[`${section}: ${category}`]?.map(tag => (
                          <SidebarMenuSub key={tag}>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton>
                                <Hash className="h-4 w-4" />
                                <span>{tag}</span>
                              </SidebarMenuSubButton>
                              {tagMap.get(tag)?.map(note => (
                                <SidebarMenuSubItem key={note.id}>
                                  <SidebarMenuSubButton 
                                    onClick={() => navigate(`/note/${note.id}`)}
                                    size="sm"
                                  >
                                    <StickyNote className="h-3 w-3" />
                                    <span>{note.content.split('\n')[0].substring(0, 30)}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        ))}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};