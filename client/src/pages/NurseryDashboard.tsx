import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { PenSquare, Trash2, Upload } from "lucide-react";
import type { Plant } from "@db/schema";
import { PlantCard } from "@/components/PlantCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NurseryDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Fetch inventory
  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
    enabled: !!user?.id,
  });

  const handleAddPlant = async (formData: FormData) => {
    try {
      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({ title: "Plant added successfully" });
      setIsAddingPlant(false);
    } catch (error: any) {
      toast({
        title: "Failed to add plant",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      fetch("/api/plants/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
        .then(response => {
          if (!response.ok) throw new Error(response.statusText);
          toast({ title: "Plants imported successfully" });
        })
        .catch(error => {
          toast({
            title: "Failed to import plants",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Plants</h2>
            <div className="flex gap-4">
              <Button onClick={() => setIsAddingPlant(true)}>
                Add New Plant
              </Button>
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isLoadingPlants ? (
              <div className="flex justify-center py-12">
                {/* Loader here */}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {plants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onEdit={() => setSelectedPlant(plant)}
                    onDelete={() => {
                      // Handle delete
                      toast({
                        title: "Not implemented",
                        description: "Delete functionality coming soon",
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {plants.length === 0 && !isLoadingPlants && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plants in inventory</p>
              <Button
                variant="link"
                onClick={() => setIsAddingPlant(true)}
                className="mt-2"
              >
                Add your first plant
              </Button>
            </div>
          )}
        </div>

        <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Plant</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPlant(new FormData(e.currentTarget));
              }}
            >
              <div>
                <Input
                  name="name"
                  placeholder="Plant Name"
                  required
                />
              </div>
              <div>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  required
                />
              </div>
              <div>
                <Input
                  name="quantity"
                  type="number"
                  placeholder="Stock Quantity"
                  required
                />
              </div>
              <Button type="submit">
                Add Plant
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}