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
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant, Order } from "@db/schema";

export default function NurseryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: [`/api/plants?nurseryId=${user?.id}`],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const addPlantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
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
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add plant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addPlantMutation.mutateAsync(formData);
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">Planted 🌱</h1>
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
            <h2 className="text-2xl font-semibold mb-6">Manage Plants</h2>

            <Dialog>
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
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Recent Orders</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Order #{order.id}</span>
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: ${Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}