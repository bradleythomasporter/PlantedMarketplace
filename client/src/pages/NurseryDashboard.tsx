import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2, Package, Sun, Droplets, Upload } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant, Order } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PlantCard } from "@/components/PlantCard";

interface PlantTemplate {
  name: string;
  scientificName: string;
  category: string;
  description: string;
  growthDetails: {
    height: string;
    spread: string;
    growthRate: string;
    sunlight: string;
    watering: string;
    soil: string;
    otherConditions?: string;
  };
  care: {
    sunlight: string;
    watering: string;
    soil: string;
    maintenance: string;
  };
  price?: number;
  stockDefault?: number;
}

interface TemplateResponse {
  plantsByType: Record<string, PlantTemplate[]>;
  seasonalPlants: {
    newPlants: PlantTemplate[];
    hellebores: PlantTemplate[];
    roses: PlantTemplate[];
  };
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

  const { data: templates, isLoading: isLoadingTemplates } = useQuery<TemplateResponse>({
    queryKey: ['/api/plants/templates'],
    retry: 2
  });

  const addPlantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const formEntries = Object.fromEntries(formData.entries());
      const price = parseFloat(formEntries.price as string);
      const quantity = parseInt(formEntries.quantity as string);

      if (!formEntries.name || !formEntries.category || isNaN(price) || isNaN(quantity)) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formEntries.name,
          scientificName: formEntries.scientificName || null,
          category: formEntries.category,
          description: formEntries.description || "",
          price,
          quantity,
          imageUrl: formEntries.imageUrl || "",
          sunExposure: formEntries.sunExposure || null,
          wateringNeeds: formEntries.wateringNeeds || null,
          soilType: formEntries.soilType || null,
          hardinessZone: formEntries.hardinessZone || null,
          matureSize: formEntries.matureSize || null,
          growthRate: formEntries.growthRate || null,
          maintainanceLevel: formEntries.maintainanceLevel || null,
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

  const CareRequirementIcon = ({ type, level }: { type: string; level: string }) => {
    const getIcon = () => {
      switch (type) {
        case 'sunlight':
          return <Sun className={`h-5 w-5 ${getColorClass(level)}`} />;
        case 'water':
          return <Droplets className={`h-5 w-5 ${getColorClass(level)}`} />;
        case 'maintenance':
          return <Package className={`h-5 w-5 ${getColorClass(level)}`} />;
        default:
          return null;
      }
    };

    const getColorClass = (level: string) => {
      switch (level.toLowerCase()) {
        case 'high':
          return 'text-red-500';
        case 'medium':
        case 'moderate':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-gray-500';
      }
    };

    return (
      <div className="flex items-center gap-1 tooltip" data-tip={`${type}: ${level}`}>
        {getIcon()}
        <span className="text-xs">{level}</span>
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
      scientificName: formData.get("scientificName") as string,
    };

    await updatePlantMutation.mutateAsync({
      id: selectedPlant.id,
      updates,
    });
  };

  const handleDelete = async (plant: Plant) => {
    await deletePlantMutation.mutateAsync(plant.id);
  };

  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    },
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: [`/api/orders?nurseryId=${user?.id}`],
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalRevenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  const renderTemplateSelection = () => {
    if (isLoadingTemplates) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!templates) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          No plant templates available
        </div>
      );
    }

    const handleTemplateSelect = (template: PlantTemplate, quantity: string) => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (!form) return;

      form.name.value = template.name;
      form.scientificName.value = template.scientificName;
      form.category.value = template.category;
      form.description.value = template.description || '';
      form.sunExposure.value = template.growthDetails.sunlight;
      form.wateringNeeds.value = template.growthDetails.watering;
      form.soilType.value = template.growthDetails.soil;
      form.price.value = template.price?.toString() || "29.99";
      form.quantity.value = quantity;
      form.maintainanceLevel.value = "low";
    };

    return (
      <div className="space-y-6">
        <div>
          <Label>Plant Templates</Label>
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

        <Accordion type="single" collapsible className="w-full">
          {Object.entries(templates.plantsByType).map(([category, plantList]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-lg font-semibold capitalize">
                {category.replace(/_/g, ' ')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-2 p-2">
                  {plantList.map((template) => (
                    <div key={template.name} className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 justify-start h-auto py-4 px-4"
                        onClick={() => handleTemplateSelect(template, "10")}
                      >
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {template.scientificName}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <div className="flex items-center text-sm">
                              <Sun className="h-4 w-4 mr-1" />
                              {template.growthDetails.sunlight}
                            </div>
                            <div className="flex items-center text-sm">
                              <Droplets className="h-4 w-4 mr-1" />
                              {template.growthDetails.watering} water
                            </div>
                            {template.growthDetails.otherConditions && (
                              <div className="text-sm text-muted-foreground">
                                • {template.growthDetails.otherConditions}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                      <Select
                        onValueChange={(value) => handleTemplateSelect(template, value)}
                        defaultValue="10"
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Qty" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 25, 50, 100].map((qty) => (
                            <SelectItem key={qty} value={qty.toString()}>
                              {qty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: [`/api/orders?nurseryId=${user?.id}`] });
      toast({ title: "Order status updated successfully" });
    } catch (error) {
      toast({
        title: "Failed to update order status",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6">Manage Plants</h2>

              <div className="flex gap-4 mb-6">
                <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
                  <DialogTrigger asChild>
                    <Button>Add New Plant</Button>
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
                              <Label htmlFor="scientificName">Scientific Name</Label>
                              <Input id="scientificName" name="scientificName" />
                            </div>
                          </div>

                          {/* Remove category dropdown */}
                          <input type="hidden" name="category" />

                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" />
                          </div>

                          <div className="space-y-2">
                            <Label>Care Requirements</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="sunExposure">Sunlight</Label>
                                <select
                                  id="sunExposure"
                                  name="sunExposure"
                                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                  <option value="full_sun">Full Sun</option>
                                  <option value="partial_sun">Partial Sun</option>
                                  <option value="partial_shade">Partial Shade</option>
                                  <option value="full_shade">Full Shade</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor="wateringNeeds">Watering</Label>
                                <select
                                  id="wateringNeeds"
                                  name="wateringNeeds"
                                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                  <option value="high">High</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="low">Low</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor="soilType">Soil Type</Label>
                                <select
                                  id="soilType"
                                  name="soilType"
                                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                  <option value="well_draining">Well-draining</option>
                                  <option value="clay">Clay</option>
                                  <option value="sandy">Sandy</option>
                                  <option value="loamy">Loamy</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="hardinessZone">Hardiness Zone</Label>
                              <Input
                                id="hardinessZone"
                                name="hardinessZone"
                                placeholder="e.g., USDA 6-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="matureSize">Mature Size</Label>
                              <Input
                                id="matureSize"
                                name="matureSize"
                                placeholder="e.g., 3-4 ft tall"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="growthRate">Growth Rate</Label>
                              <Input
                                id="growthRate"
                                name="growthRate"
                                placeholder="e.g., Fast, Moderate, Slow"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maintainanceLevel">Maintenance Level</Label>
                              <select
                                id="maintainanceLevel"
                                name="maintainanceLevel"
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="high">High</option>
                                <option value="moderate">Moderate</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>Import Plants from CSV</DialogTitle>
                      <DialogDescription>
                        Upload a CSV file to bulk import your plant inventory.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 px-1">
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="font-medium mb-2">CSV Format</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your CSV file should include the following columns:
                          </p>
                          <div className="relative bg-muted/50 rounded-lg p-4">
                            <div className="font-mono text-xs text-muted-foreground break-all">
                              name,scientificName,category,description,price,quantity,imageUrl,
                              sunExposure,wateringNeeds,soilType,hardinessZone,matureSize,
                              growthRate,maintainanceLevel
                            </div>
                          </div>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs mt-4"
                            onClick={() => {
                              const csvContent = `name,scientificName,category,description,price,quantity,imageUrl,sunExposure,wateringNeeds,soilType,hardinessZone,matureSize,growthRate,maintainanceLevel
Lavender 'Hidcote',Lavandula angustifolia 'Hidcote',flowers,"Compact English lavender variety",29.99,10,,full_sun,low,well-draining,USDA 5-9,40-60cm,medium,low
Japanese Maple,Acer palmatum,trees,"Elegant ornamental tree",89.99,5,,partial_shade,moderate,well-draining,USDA 5-8,4-6m,slow,medium`;

                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'plant_template.csv';
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                          >
                            Download template CSV
                          </Button>
                        </CardContent>
                      </Card>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);

                          try {
                            const response = await fetch('/api/plants/upload', {
                              method: 'POST',
                              credentials: 'include',
                              body: formData,
                            });

                            if (!response.ok) {
                              throw new Error(await response.text());
                            }

                            const result = await response.json();
                            toast({
                              title: "Upload successful",
                              description: result.message,
                            });

                            queryClient.invalidateQueries({ queryKey: [`/api/plants?nurseryId=${user?.id}`] });
                            e.currentTarget.reset();
                          } catch (error: any) {
                            toast({
                              title: "Upload failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="csvFile">Choose CSV File</Label>
                          <Input
                            id="csvFile"
                            name="file"
                            type="file"
                            accept=".csv"
                            required
                            className="cursor-pointer"
                          />
                        </div>
                        <Button type="submit" className="w-full">Upload</Button>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {plants.map((plant) => (
                  <div key={plant.id} className="relative group">
                    <PlantCard plant={plant} />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setSelectedPlant(plant)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setPlantToDelete(plant)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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

              {isLoadingPlants && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="orders" className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border roundedlg">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </h3>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pending Orders
                </h3>
                <p className="text-2xl font-bold">{pendingOrders}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </h3>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Recent Orders</h2>
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
                          className="w-[180px] rounded-md border border-input bg-background px-3 py-2"
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
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
              <h2 className="text-2xl font-semibold mb-6">Profile Settings</h2>
              {user && (
                <form className="space-y-4 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input id="name" name="name" defaultValue={user.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={user.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" defaultValue={user.address} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber || ""} />
                  </div>
                  <Button type="submit">Update Profile</Button>
                </form>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}