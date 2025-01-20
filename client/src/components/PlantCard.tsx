import { Card } from "@/components/ui/card";
import type { Plant } from "@db/schema";
import { PenSquare, Trash2 } from "lucide-react";

type PlantCardProps = {
  plant: Plant;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PlantCard({ plant, onEdit, onDelete }: PlantCardProps) {
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
              onClick={onEdit}
              className="p-2 hover:bg-secondary rounded-full"
            >
              <PenSquare className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
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