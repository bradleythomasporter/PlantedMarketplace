import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant } from "@db/schema";

export default function NurseryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: [`/api/plants?nurseryId=${user?.id}`],
  });

  const addPlantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user?.address) {
        throw new Error("Nursery address is required");
      }

      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(user.address)}`);
      if (!geocodeResponse.ok) {
        throw new Error("Failed to geocode address");
      }
      const { latitude, longitude, zipCode } = await geocodeResponse.json();

      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.get("name"),
          category: formData.get("category"),
          description: formData.get("description"),
          price: parseFloat(formData.get("price") as string),
          quantity: parseInt(formData.get("quantity") as string),
          imageUrl: formData.get("imageUrl"),
          latitude,
          longitude,
          zipCode,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants?nurseryId=${user?.id}`] });
      toast({
        title: "Plant added successfully",
      });
      setIsAddingPlant(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add plant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlantMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Plant> }) => {
      const response = await fetch(`/api/plants/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants?nurseryId=${user?.id}`] });
      toast({
        title: "Plant updated successfully",
      });
      setSelectedPlant(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update plant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlantMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/plants/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants?nurseryId=${user?.id}`] });
      toast({
        title: "Plant deleted successfully",
      });
      setPlantToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete plant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addPlantMutation.mutateAsync(formData);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlant) return;

    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      quantity: parseInt(formData.get("quantity") as string),
      imageUrl: formData.get("imageUrl") as string,
    };

    await updatePlantMutation.mutateAsync({
      id: selectedPlant.id,
      updates,
    });
  };

  const handleDelete = async (plant: Plant) => {
    await deletePlantMutation.mutateAsync(plant.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary text-display">Planted 🌱</h1>
            <Button variant="ghost" onClick={() => setLocation("/")}>
              View Store
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm hidden md:inline">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plant Management */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-display">Manage Plants</h2>

            <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
              <DialogTrigger asChild>
                <Button className="mb-6">Add New Plant</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Plant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plant Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flowers">Flowers</SelectItem>
                        <SelectItem value="trees">Trees</SelectItem>
                        <SelectItem value="shrubs">Shrubs</SelectItem>
                        <SelectItem value="indoor">Indoor</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" name="imageUrl" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Add Plant
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Plant Dialog */}
            <Dialog open={!!selectedPlant} onOpenChange={(open) => !open && setSelectedPlant(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Plant</DialogTitle>
                </DialogHeader>
                {selectedPlant && (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Plant Name</Label>
                      <Input
                        id="edit-name"
                        name="name"
                        defaultValue={selectedPlant.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select name="category" defaultValue={selectedPlant.category}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flowers">Flowers</SelectItem>
                          <SelectItem value="trees">Trees</SelectItem>
                          <SelectItem value="shrubs">Shrubs</SelectItem>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        name="description"
                        defaultValue={selectedPlant.description}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-price">Price</Label>
                      <Input
                        id="edit-price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={selectedPlant.price}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-quantity">Quantity</Label>
                      <Input
                        id="edit-quantity"
                        name="quantity"
                        type="number"
                        defaultValue={selectedPlant.quantity}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-imageUrl">Image URL</Label>
                      <Input
                        id="edit-imageUrl"
                        name="imageUrl"
                        defaultValue={selectedPlant.imageUrl}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Update Plant
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              open={!!plantToDelete}
              onOpenChange={(open) => !open && setPlantToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the plant from your inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => plantToDelete && handleDelete(plantToDelete)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {plants.map((plant) => (
                  <div
                    key={plant.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{plant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Stock: {plant.quantity} | ${Number(plant.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPlant(plant)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPlantToDelete(plant)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Info Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-display">Nursery Information</h2>
            <div className="p-4 border rounded-lg">
              <p className="font-semibold">{user?.name}</p>
              {user?.address && (
                <p className="text-sm text-muted-foreground mt-2">
                  {user.address}
                </p>
              )}
              {user?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {user.description}
                </p>
              )}
              {user?.hoursOfOperation && (
                <p className="text-sm text-muted-foreground mt-2">
                  Hours: {user.hoursOfOperation}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}