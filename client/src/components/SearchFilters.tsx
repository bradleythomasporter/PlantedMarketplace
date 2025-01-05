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
  zipCode: string;
  radius: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
};

export function SearchFilters({
  search,
  category,
  zipCode,
  radius,
  onSearchChange,
  onCategoryChange,
  onZipCodeChange,
  onRadiusChange,
}: SearchFiltersProps) {
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search plants..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
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

      <div className="flex flex-wrap gap-4 items-center bg-primary/5 p-4 rounded-lg">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label htmlFor="zipCode" className="text-sm font-medium">
            Find plants near you
          </label>
          <Input
            id="zipCode"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={handleZipCodeChange}
            className="w-full"
            type="text"
            inputMode="numeric"
            maxLength={5}
            pattern="[0-9]*"
          />
        </div>
        <Select value={radius} onValueChange={onRadiusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Within 5 miles</SelectItem>
            <SelectItem value="10">Within 10 miles</SelectItem>
            <SelectItem value="20">Within 20 miles</SelectItem>
            <SelectItem value="50">Within 50 miles</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}