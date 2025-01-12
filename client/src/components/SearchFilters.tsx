import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { MapPin, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type SearchFiltersProps = {
  search: string;
  zipCode: string;
  radius: string;
  category: string;
  priceRange: [number, number];
  sortBy: string;
  onSearchChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriceRangeChange: (value: [number, number]) => void;
  onSortByChange: (value: string) => void;
  onClearFilters: () => void;
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
  zipCode,
  radius,
  category,
  priceRange,
  sortBy,
  onSearchChange,
  onZipCodeChange,
  onRadiusChange,
  onCategoryChange,
  onPriceRangeChange,
  onSortByChange,
  onClearFilters,
}: SearchFiltersProps) {
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  const hasActiveFilters = 
    search !== "" || 
    zipCode !== "" || 
    radius !== "20" || 
    category !== "all" || 
    priceRange[0] !== 0 || 
    priceRange[1] !== 1000 ||
    sortBy !== "relevance";

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plants, flowers, or trees..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Category Pills */}
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

      {/* Location and Filters */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Sort by relevance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Sort by relevance</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="filters">
          <AccordionTrigger>Advanced Filters</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price Range</span>
                  <span>${priceRange[0]} - ${priceRange[1]}</span>
                </div>
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={priceRange}
                  onValueChange={onPriceRangeChange}
                  className="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}