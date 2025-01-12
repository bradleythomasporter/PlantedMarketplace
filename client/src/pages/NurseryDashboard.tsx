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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2, Package } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant, Order } from "@db/schema";

interface PlantTemplate {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  subCategory: string;
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
  properties: {
    hardinessZone: string;
    soilType: string[];
    moisture: string;
    ph: string;
    droughtTolerant: boolean;
    frostTolerant: boolean;
  };
  seasonalInterest: {
    spring: string;
    summer: string;
    autumn: string;
    winter: string;
  };
  imageUrl: string;
  mainCategory: string;
}

const mainCategories = {
  outdoor: ["Perennials", "Shrubs", "Trees", "Climbers", "Bulbs"],
  indoor: ["Foliage Plants", "Flowering Plants", "Succulents", "Air Plants"],
  garden_type: ["Cottage Garden", "Mediterranean", "Tropical", "Woodland"],
  special_features: ["Fragrant", "Bee Friendly", "Drought Resistant", "Shade Loving"]
} as const;

type MainCategory = keyof typeof mainCategories;
type SubCategory<T extends MainCategory> = typeof mainCategories[T][number];

export default function NurseryDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("basics");
  const [selectedMainCategory, setSelectedMainCategory] = useState("none");
  const [availablePlants, setAvailablePlants] = useState<PlantTemplate[]>([]);

  const { data: plantTemplates = {}, isLoading: isLoadingTemplates } = useQuery<Record<string, PlantTemplate[]>>({
    queryKey: ['/api/plants/templates'],
  });

  useEffect(() => {
    if (selectedMainCategory && selectedMainCategory !== "none" && plantTemplates[selectedMainCategory]) {
      setAvailablePlants(plantTemplates[selectedMainCategory]);
    } else {
      setAvailablePlants([]);
    }
  }, [selectedMainCategory, plantTemplates]);

  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/plants?nurseryId=${user?.id}`],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: [`/api/orders?nurseryId=${user?.id}`],
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addPlantMutation.mutateAsync(formData);
  };

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

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalRevenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  const categories = Object.keys(plantTemplates).reduce((acc, category) => {
    acc[category] = new Set();
    (plantTemplates[category] || []).forEach(template => acc[category]?.add(template.subCategory));
    return acc;
  }, {} as Record<string, Set<string>>);

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    if (templateId === 'none') {
      form.reset();
      setMainCategory(null);
      setSubCategory(null);
      return;
    }

    const template = availablePlants.find(p => p.id === templateId);
    if (template) {
      form.name.value = template.name;
      form.scientificName.value = template.scientificName;
      form.description.value = template.description;
      form.imageUrl.value = template.imageUrl;

      Object.entries(template.growthDetails).forEach(([key, value]) => {
        const input = form.elements.namedItem(key) as HTMLInputElement;
        if (input) input.value = value;
      });

      Object.entries(template.careInstructions).forEach(([key, value]) => {
        const input = form.elements.namedItem(key) as HTMLInputElement;
        if (input) input.value = value;
      });

      setMainCategory(template.mainCategory as MainCategory);
      setSubCategory(template.subCategory);
    }
  };

  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>1. Select Plant Type</Label>
        <Select
          value={selectedMainCategory}
          onValueChange={(value) => {
            setSelectedMainCategory(value);
            if (value === "none") {
              setSelectedTemplate("none");
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select plant type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Custom Plant</SelectItem>
            {Object.keys(plantTemplates).map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMainCategory !== "none" && (
        <div className="space-y-2">
          <Label>2. Select Plant</Label>
          <Select
            value={selectedTemplate}
            onValueChange={handleTemplateSelection}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a plant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a plant</SelectItem>
              {availablePlants.map((plant) => (
                <SelectItem key={plant.id} value={plant.id}>
                  {plant.name} ({plant.scientificName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedTemplate !== "none" && (
        <div className="mt-4">
          <img
            src={availablePlants.find(p => p.id === selectedTemplate)?.imageUrl}
            alt="Selected plant"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );

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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Accordion
                      type="single"
                      collapsible
                      value={activeSection}
                      onValueChange={setActiveSection}
                      className="w-full"
                    >
                      <AccordionItem value="template">
                        <AccordionTrigger>Plant Selection</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          {renderTemplateSelection()}
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="basics">
                        <AccordionTrigger>Basic Information</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Common Name</Label>
                              <Input id="name" name="name" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="scientificName">Scientific Name</Label>
                              <Input id="scientificName" name="scientificName" required />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Main Category</Label>
                              <Select
                                value={mainCategory || "none"}
                                onValueChange={(value) => {
                                  setMainCategory(value === "none" ? null : value as MainCategory);
                                  setSubCategory(null);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select main category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Select category</SelectItem>
                                  {(Object.keys(mainCategories) as MainCategory[]).map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category.split('_').map(word =>
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                      ).join(' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {mainCategory && (
                              <div className="space-y-2">
                                <Label>Sub-Category</Label>
                                <Select
                                  value={subCategory || "none"}
                                  onValueChange={(value) => setSubCategory(value === "none" ? null : value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sub-category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Select sub-category</SelectItem>
                                    {mainCategories[mainCategory].map((sub) => (
                                      <SelectItem key={sub} value={sub}>
                                        {sub}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" required />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="growth">
                        <AccordionTrigger>Growth Details</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="height">Height</Label>
                              <Input id="height" name="height" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="spread">Spread</Label>
                              <Input id="spread" name="spread" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="growthRate">Growth Rate</Label>
                            <Input id="growthRate" name="growthRate" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ultimateHeight">Ultimate Height</Label>
                            <Input id="ultimateHeight" name="ultimateHeight" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timeToUltimateHeight">Time to Ultimate Height</Label>
                            <Input id="timeToUltimateHeight" name="timeToUltimateHeight" required />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="care">
                        <AccordionTrigger>Care Instructions</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          <div className="space-y-2">
                            <Label htmlFor="sunlight">Sunlight Requirements</Label>
                            <Input id="sunlight" name="sunlight" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="watering">Watering Needs</Label>
                            <Input id="watering" name="watering" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="soil">Soil Requirements</Label>
                            <Input id="soil" name="soil" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pruning">Pruning Instructions</Label>
                            <Input id="pruning" name="pruning" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fertilizer">Fertilizer</Label>
                            <Input id="fertilizer" name="fertilizer" required />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="image">
                        <AccordionTrigger>Image</AccordionTrigger>
                        <AccordionContent className="space-y-4 p-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input id="imageUrl" name="imageUrl" required />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="pt-4 border-t">
                      <Button type="submit" className="w-full">
                        Add Plant
                      </Button>
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
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
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