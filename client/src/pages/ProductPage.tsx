import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LeafyGreen, MapPin } from "lucide-react";
import type { Plant } from "@db/schema";

export default function ProductPage({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showGardenerModal, setShowGardenerModal] = useState(false);

  const { data: plant, isLoading } = useQuery<Plant>({
    queryKey: [`/api/plants/${params.id}`],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Plant not found</p>
        <Button variant="link" onClick={() => setLocation("/")}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            ← Back to Plants
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-white">
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-display mb-2">{plant.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Local nursery in {plant.zipCode}</span>
              </div>
              <p className="text-2xl font-semibold mt-4">
                ${Number(plant.price).toFixed(2)}
              </p>
            </div>

            <div className="space-y-4">
              <Button className="w-full" size="lg">
                Add to Cart
              </Button>

              <Dialog open={showGardenerModal} onOpenChange={setShowGardenerModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" size="lg">
                    <LeafyGreen className="mr-2 h-4 w-4" />
                    Request Professional Planting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Professional Planting Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Our certified Planted gardeners will plant this {plant.name} in your garden,
                      ensuring optimal placement and care instructions.
                    </p>
                    <Card className="p-4">
                      <p className="font-semibold">Service includes:</p>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li>• Professional planting by certified gardener</li>
                        <li>• Soil assessment and preparation</li>
                        <li>• Care instructions and 30-day guarantee</li>
                        <li>• Follow-up maintenance tips</li>
                      </ul>
                    </Card>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Service Request Sent",
                          description: "A gardener will contact you to schedule the planting.",
                        });
                        setShowGardenerModal(false);
                      }}
                    >
                      Request Service (+$49.99)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{plant.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Category: {plant.category}</li>
                <li>Stock: {plant.quantity} available</li>
                <li>Local pickup available</li>
                <li>Delivery options available</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
