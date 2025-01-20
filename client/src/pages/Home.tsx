import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlantCard } from "@/components/PlantCard";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  TreeDeciduous,
  Flower2,
  HomeIcon,
  Sprout,
  Apple,
  Leaf,
  FlowerIcon,
  TreePine,
  Shrub,
  Umbrella,
} from "lucide-react";

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      const response = await fetch(`/api/plants?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Categories */}
      <ScrollArea className="w-full border-b">
        <div className="flex px-4 py-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className={cn(
                  "flex-col h-auto px-4 py-2 mr-2 min-w-[80px]",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
              >
                <Icon className="mb-1 h-5 w-5" />
                <span className="text-xs">{category.label}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Plants Grid */}
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plants.map((plant: any) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </div>
    </div>
  );
}