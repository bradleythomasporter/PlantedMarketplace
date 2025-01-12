import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2, Package } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant, Order } from "@db/schema";

interface PlantTemplate {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  growthDetails: {
    height: string;
    spread: string;
    growthRate: string;
    ultimateHeight: string;
    timeToUltimateHeight: string;
  };
  careInstructions: {
    sunlight: string;
    watering: string;
    soil: string;
    pruning: string;
    fertilizer: string;
  };
  imageUrl: string;
}

export default function NurseryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [activeSection, setActiveSection] = useState("template");

  const { data: plantTemplates = {}, isLoading: isLoadingTemplates } = useQuery<Record<string, PlantTemplate[]>>({
    queryKey: ['/api/plants/templates'],
    retry: 2,
    onError: (error) => {
      toast({
        title: "Error loading templates",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  });

  const addPlantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Basic validation
      const name = formData.get("name") as string;
      const category = formData.get("category") as string;
      const price = parseFloat(formData.get("price") as string);
      const quantity = parseInt(formData.get("quantity") as string);

      if (!name || !category || isNaN(price) || isNaN(quantity)) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          category,
          description: formData.get("description"),
          price,
          quantity,
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

  const handleAddPlant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addPlantMutation.mutate(formData);
  };

  const renderTemplateSelection = () => {
    const categories = {
      indoor: "Indoor Plants",
      outdoor: "Outdoor Plants",
      flowers: "Flowers",
      trees: "Trees",
      shrubs: "Shrubs"
    };

    return (
      <div className="space-y-6">
        <div>
          <Label>Plant Type</Label>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.reset();
            }}
          >
            Custom Plant
          </Button>
        </div>

        {Object.entries(categories).map(([category, label]) => (
          <div key={category} className="space-y-2">
            <Label className="text-lg font-semibold">{label}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plantTemplates[category]?.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="justify-start h-auto py-4 px-4"
                  onClick={() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (!form) return;

                    form.name.value = template.name;
                    form.category.value = category;
                    form.description.value = template.description;
                    form.imageUrl.value = template.imageUrl;

                    // Set some default values for required fields
                    form.price.value = "29.99";
                    form.quantity.value = "10";
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders?nurseryId=${user?.id}`] });
      toast({
        title: "Order status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlant) return;

    const formData = new FormData(e.currentTarget);
    const category = formData.get("category") as "flowers" | "trees" | "shrubs" | "indoor" | "outdoor";
    const updates = {
      name: formData.get("name") as string,
      category,
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

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    await updateOrderStatusMutation.mutateAsync({ orderId, status });
  };

  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/plants?nurseryId=${user?.id}`],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: [`/api/orders?nurseryId=${user?.id}`],
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalRevenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);


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
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await logout();
                  setLocation("/login");
                } catch (error) {
                  toast({
                    title: "Error logging out",
                    description: "Please try again",
                    variant: "destructive",
                  });
                }
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-display">Manage Plants</h2>

              <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
                <DialogTrigger asChild>
                  <Button className="mb-6">Add New Plant</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Plant</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPlant} className="space-y-6">
                    <div className="space-y-4">
                      {renderTemplateSelection()}

                      <div className="pt-4 border-t space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Plant Name *</Label>
                            <Input id="name" name="name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <select
                              id="category"
                              name="category"
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                              required
                            >
                              <option value="">Select Category</option>
                              <option value="indoor">Indoor Plants</option>
                              <option value="outdoor">Outdoor Plants</option>
                              <option value="flowers">Flowers</option>
                              <option value="trees">Trees</option>
                              <option value="shrubs">Shrubs</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price">Price ($) *</Label>
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                              id="quantity"
                              name="quantity"
                              type="number"
                              min="1"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input id="imageUrl" name="imageUrl" />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={addPlantMutation.isPending}
                        >
                          {addPlantMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Add Plant
                        </Button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

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
                        <select id="edit-category" name="category" defaultValue={selectedPlant.category} className="w-full rounded-md border border-input bg-background px-3 py-2">
                          <option value="flowers">Flowers</option>
                          <option value="trees">Trees</option>
                          <option value="shrubs">Shrubs</option>
                          <option value="indoor">Indoor</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
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

              {isLoadingPlants ? (
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
          </TabsContent>

          <TabsContent value="orders" className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Orders</h3>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6 text-display">Recent Orders</h2>
              {isLoadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="w-[180px] rounded-md border border-input bg-background px-3 py-2"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Total Amount: ${Number(order.totalAmount).toFixed(2)}</span>
                        {order.requiresPlanting && (
                          <span className="flex items-center gap-1 text-primary">
                            <Package className="h-4 w-4" />
                            Includes Planting Service
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Shipping Address:</p>
                        <p>{order.shippingAddress}</p>
                      </div>
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No orders yet
                    </p>
                  )}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="profile" className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-display">Nursery Profile</h2>
            </section>
          </TabsContent>
        </Tabs>

        <section className="mt-8">
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
      </main>
    </div>
  );
}