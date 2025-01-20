import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sun, Droplets, ThermometerSun } from "lucide-react";
import type { Plant } from "@db/schema";

type PlantCardProps = {
  plant: Plant;
};

export function PlantCard({ plant }: PlantCardProps) {
  const [, setLocation] = useLocation();

  const getCareIcon = (type: string, level: string) => {
    const getColorClass = (level: string) => {
      switch (level.toLowerCase()) {
        case 'high':
          return 'text-red-500';
        case 'medium':
        case 'moderate':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-gray-500';
      }
    };

    switch (type) {
      case 'sun':
        return <Sun className={`h-4 w-4 ${getColorClass(level)}`} />;
      case 'water':
        return <Droplets className={`h-4 w-4 ${getColorClass(level)}`} />;
      case 'temperature':
        return <ThermometerSun className={`h-4 w-4 ${getColorClass(level)}`} />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden group">
      <CardHeader className="p-0 relative">
        <img
          src={plant.imageUrl || '/placeholder-plant.jpg'}
          alt={plant.name}
          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
        />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{plant.name}</h3>
        {plant.scientificName && (
          <p className="text-sm text-muted-foreground italic mb-2">
            {plant.scientificName}
          </p>
        )}
        <div className="flex items-center gap-3 mb-2">
          {plant.lightRequirement && (
            <div className="flex items-center gap-1" title="Light requirement">
              {getCareIcon('sun', plant.lightRequirement)}
              <span className="text-xs capitalize">{plant.lightRequirement.replace('_', ' ')}</span>
            </div>
          )}
          {plant.waterRequirement && (
            <div className="flex items-center gap-1" title="Water requirement">
              {getCareIcon('water', plant.waterRequirement)}
              <span className="text-xs capitalize">{plant.waterRequirement}</span>
            </div>
          )}
          {plant.temperatureMin && plant.temperatureMax && (
            <div className="flex items-center gap-1" title="Temperature range">
              {getCareIcon('temperature', 'medium')}
              <span className="text-xs">{plant.temperatureMin}°-{plant.temperatureMax}°C</span>
            </div>
          )}
        </div>
        <p className="text-sm line-clamp-2 mb-2">{plant.description}</p>
        <p className="text-lg font-bold mt-2">${Number(plant.price).toFixed(2)}</p>
        {plant.inStock ? (
          <p className="text-sm text-green-600">In Stock</p>
        ) : (
          <p className="text-sm text-red-600">Out of Stock</p>
        )}
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