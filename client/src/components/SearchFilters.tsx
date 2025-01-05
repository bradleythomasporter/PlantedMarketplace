import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchFiltersProps = {
  search: string;
  category: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function SearchFilters({
  search,
  category,
  onSearchChange,
  onCategoryChange,
}: SearchFiltersProps) {
  return (
    <div className="flex gap-4 mb-6">
      <Input
        placeholder="Search plants..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="flowers">Flowers</SelectItem>
          <SelectItem value="trees">Trees</SelectItem>
          <SelectItem value="shrubs">Shrubs</SelectItem>
          <SelectItem value="indoor">Indoor</SelectItem>
          <SelectItem value="outdoor">Outdoor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}