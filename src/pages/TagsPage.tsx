import { TagView } from "@/components/TagView";
import { BottomNav } from "@/components/BottomNav";

const TagsPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Tags Overview</h1>
      <TagView />
      <BottomNav />
    </div>
  );
};

export default TagsPage;