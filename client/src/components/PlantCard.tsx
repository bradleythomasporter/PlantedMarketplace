import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { Plant } from "@db/schema";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PlantCardProps = {
  plant: Plant;
};

export function PlantCard({ plant }: PlantCardProps) {
  const [quantity, setQuantity] = useState("1");
  const { addItem } = useCart();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="w-full h-48 object-cover"
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
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Select
          value={quantity}
          onValueChange={setQuantity}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Quantity" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          className="flex-1"
          onClick={() => addItem(plant, parseInt(quantity))}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
