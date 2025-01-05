import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Plant } from "@db/schema";

type PlantCardProps = {
  plant: Plant;
};

export function PlantCard({ plant }: PlantCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="overflow-hidden group">
      <CardHeader className="p-0 relative">
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
        />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{plant.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {plant.category}
        </p>
        <p className="text-sm line-clamp-2">{plant.description}</p>
        <p className="text-lg font-bold mt-2">${Number(plant.price).toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full"
          onClick={() => setLocation(`/plants/${plant.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}