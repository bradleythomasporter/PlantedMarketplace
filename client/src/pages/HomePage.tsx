import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/PlantCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  TreeDeciduous, 
  Flower2, 
  Home as HomeIcon, 
  Sprout, 
  Apple, 
  Leaf, 
  FlowerIcon, 
  Umbrella, 
  TreePine, 
  Shrub 
} from "lucide-react";
import type { Plant } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const categories = [
  { id: "indoor", label: "Indoor", icon: HomeIcon },
  { id: "outdoor", label: "Outdoor", icon: Umbrella },
  { id: "trees", label: "Trees", icon: TreeDeciduous },
  { id: "shrubs", label: "Shrubs", icon: Shrub },
  { id: "flowers", label: "Flowers", icon: Flower2 },
  { id: "perennials", label: "Perennials", icon: FlowerIcon },
  { id: "climbers", label: "Climbers", icon: Sprout },
  { id: "fruit", label: "Fruit Trees", icon: Apple },
  { id: "herbs", label: "Herbs", icon: Leaf },
  { id: "conifers", label: "Conifers", icon: TreePine },
];

const defaultFilters = {
  search: "",
  zipCode: "",
  radius: "20",
  category: "all",
  priceRange: [0, 1000] as [number, number],
  sortBy: "relevance",
};

export default function HomePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const { user } = useUser();
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Build query string for API
  const queryString = new URLSearchParams({
    search: filters.search,
    category: selectedCategory || filters.category,
    zipCode: filters.zipCode,
    radius: filters.radius,
    minPrice: filters.priceRange[0].toString(),
    maxPrice: filters.priceRange[1].toString(),
    sortBy: filters.sortBy,
  }).toString();

  // Fetch plants with filters
  const { data: plants = [], isLoading, error } = useQuery<Plant[]>({
    queryKey: [`/api/plants?${queryString}`],
  });

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="pt-[72px] md:pt-[88px]">
        {/* Search Filters */}
        <div className="bg-primary/5 py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              <SearchFilters
                {...filters}
                onSearchChange={(search) => setFilters(prev => ({ ...prev, search }))}
                onZipCodeChange={(zipCode) => setFilters(prev => ({ ...prev, zipCode }))}
                onRadiusChange={(radius) => setFilters(prev => ({ ...prev, radius }))}
                onCategoryChange={(category) => setFilters(prev => ({ ...prev, category }))}
                onPriceRangeChange={(priceRange) => setFilters(prev => ({ ...prev, priceRange }))}
                onSortByChange={(sortBy) => setFilters(prev => ({ ...prev, sortBy }))}
                onClearFilters={handleClearFilters}
              />

              {/* Category Icons - Moved below search */}
              <div className="mt-6">
                <ScrollArea className="w-full">
                  <div className="flex gap-4">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          className={cn(
                            "flex-col h-auto px-6 py-4 min-w-[100px]",
                            selectedCategory === category.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setSelectedCategory(
                            selectedCategory === category.id ? null : category.id
                          )}
                        >
                          <Icon className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">{category.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No plants found. Try adjusting your search or filters.
              </p>
              {Object.values(filters).some(v => v !== defaultFilters[v as keyof typeof defaultFilters]) && (
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">
                  Showing {plants.length} result{plants.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plants.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} />
                ))}
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}