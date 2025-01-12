import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

type SearchFiltersProps = {
  search: string;
  zipCode: string;
  radius: string;
  onSearchChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
};

export function SearchFilters({
  search,
  zipCode,
  radius,
  onSearchChange,
  onZipCodeChange,
  onRadiusChange,
}: SearchFiltersProps) {
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search plants..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-white"
      />

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={handleZipCodeChange}
              className="border-0 p-0 focus-visible:ring-0 text-base"
              type="text"
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]*"
            />
          </div>
        </div>
        <Select value={radius} onValueChange={onRadiusChange}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="Within 20 miles" />
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