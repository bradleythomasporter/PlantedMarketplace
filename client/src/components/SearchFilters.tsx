import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type SearchFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  category: string;
};

const categories = [
  { id: "all", label: "All Plants" },
  { id: "flowers", label: "Flowers" },
  { id: "trees", label: "Trees" },
  { id: "shrubs", label: "Shrubs" },
  { id: "indoor", label: "Indoor Plants" },
  { id: "outdoor", label: "Outdoor Plants" },
];

export function SearchFilters({
  search,
  onSearchChange,
  onCategoryChange,
  category,
}: SearchFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plants, flowers, or trees..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}