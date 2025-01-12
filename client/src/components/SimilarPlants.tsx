import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plant } from "@db/schema";

interface SimilarPlantsProps {
  currentPlant: Plant;
}

export function SimilarPlants({ currentPlant }: SimilarPlantsProps) {
  const [, setLocation] = useLocation();
  
  const { data: plants, isLoading } = useQuery<Plant[]>({
    queryKey: [`/api/plants?category=${currentPlant.category}&limit=4`],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <Skeleton className="h-48 rounded-t-lg" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const similarPlants = plants?.filter(p => p.id !== currentPlant.id).slice(0, 4) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {similarPlants.map((plant) => (
        <Card 
          key={plant.id}
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={() => setLocation(`/plants/${plant.id}`)}
        >
          <CardContent className="p-0">
            <div className="aspect-square rounded-t-lg overflow-hidden">
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{plant.name}</h3>
              <p className="text-sm text-muted-foreground">
                ${Number(plant.price).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
