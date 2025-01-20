import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Sun, Droplets, ThermometerSun, Clock, MapPin } from "lucide-react";
import type { Plant } from "@db/schema";

type PlantCardProps = {
  plant: Plant;
};

export function PlantCard({ plant }: PlantCardProps) {
  const [, setLocation] = useLocation();

  const getCareIcon = (type: string, value: string | null) => {
    if (!value) return null;

    const getColorClass = (level: string) => {
      switch (level.toLowerCase()) {
        case 'high':
          return 'text-red-500';
        case 'medium':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-gray-500';
      }
    };

    const iconClass = `h-4 w-4 ${getColorClass(value)}`;

    switch (type) {
      case 'sun':
        return <Sun className={iconClass} />;
      case 'water':
        return <Droplets className={iconClass} />;
      case 'temperature':
        return <ThermometerSun className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <Card className="group cursor-pointer" onClick={() => setLocation(`/plants/${plant.id}`)}>
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
          <img
            src={plant.imageUrl || '/placeholder-plant.jpg'}
            alt={plant.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        {plant.featured && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-base line-clamp-1">{plant.name}</h3>
            {plant.scientificName && (
              <p className="text-xs text-muted-foreground italic line-clamp-1">
                {plant.scientificName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            ${Number(plant.price).toFixed(2)}
          </div>
        </div>

        {/* Care requirements */}
        <div className="flex items-center gap-3 mb-2">
          {getCareIcon('sun', plant.sunExposure)}
          {getCareIcon('water', plant.wateringNeeds)}
          {plant.hardinessZone && (
            <div className="text-xs text-muted-foreground">
              Zone {plant.hardinessZone}
            </div>
          )}
        </div>

        {/* Location and delivery info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {plant.distance ? (
              <span>{plant.distance.toFixed(1)} km away</span>
            ) : (
              <span>Distance varies</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {plant.isAvailableForDelivery ? "Delivery available" : "Pickup only"}
            </span>
          </div>
        </div>

        {/* Stock status */}
        {!plant.inStock && (
          <div className="mt-2 text-xs text-destructive font-medium">
            Currently unavailable
          </div>
        )}
      </CardContent>
    </Card>
  );
}