import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { PenSquare, Trash2 } from "lucide-react";
import type { Plant } from "@db/schema";

type PlantCardProps = {
  plant: Plant;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: 'product' | 'inventory';
};

export function PlantCard({ plant, onEdit, onDelete, variant = 'product' }: PlantCardProps) {
  const [, setLocation] = useLocation();

  if (variant === 'inventory') {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{plant.name}</h3>
            <p className="text-sm text-muted-foreground">
              Stock: {plant.quantity} | ${Number(plant.price).toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 hover:bg-secondary rounded-full"
              >
                <PenSquare className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 hover:bg-secondary rounded-full text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="group cursor-pointer overflow-hidden"
      onClick={() => setLocation(`/plants/${plant.id}`)}
    >
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden">
          <img
            src={plant.imageUrl || '/placeholder-plant.jpg'}
            alt={plant.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{plant.name}</h3>
              {plant.scientificName && (
                <p className="text-sm text-muted-foreground italic">
                  {plant.scientificName}
                </p>
              )}
            </div>
            <p className="font-semibold">${Number(plant.price).toFixed(2)}</p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {plant.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}