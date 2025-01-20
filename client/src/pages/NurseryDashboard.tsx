import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Loader2, PenSquare, Trash2, Upload } from "lucide-react";
import { useLocation } from "wouter";
import type { Plant, Order } from "@db/schema";
import { PlantCard } from "@/components/PlantCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NurseryDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Fetch inventory
  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch plant templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/plants/templates'],
  });

  // Fetch orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: [`/api/orders?nurseryId=${user?.id}`],
    enabled: !!user?.id,
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const totalRevenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  const addPlantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory?nurseryId=${user?.id}`] });
      toast({ title: "Plant added successfully" });
      setIsAddingPlant(false);
      setIsUsingTemplate(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add plant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch("/api/plants/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory?nurseryId=${user?.id}`] });
      toast({ title: "Plants imported successfully" });
      setCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import plants",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      uploadCsvMutation.mutate(file);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
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

  const handleTemplateSelect = (template: any) => {
    const formData = new FormData();
    formData.append('name', template.name);
    formData.append('description', template.description);
    formData.append('category', template.category);
    formData.append('price', template.price.toString());
    formData.append('quantity', template.stockDefault.toString());

    addPlantMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6">Manage Plants</h2>

              <div className="flex gap-4 mb-6">
                <Button onClick={() => setIsAddingPlant(true)}>
                  Add New Plant
                </Button>
                <Button onClick={() => setIsUsingTemplate(true)}>
                  Use Template
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
                    Upload CSV
                  </Button>
                </div>
              </div>

              {isLoadingPlants ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
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
              )}

              {/* Template Selection Dialog */}
              <Dialog open={isUsingTemplate} onOpenChange={setIsUsingTemplate}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select a Plant Template</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    {isLoadingTemplates ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {templates && Object.entries(templates.plantsByType).map(([category, plants]) => (
                          <div key={category}>
                            <h3 className="text-lg font-semibold capitalize mb-2">{category}</h3>
                            <div className="grid gap-2">
                              {(plants as any[]).map((template, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => handleTemplateSelect(template)}
                                >
                                  {template.name} - ${template.price}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

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
            </section>
          </TabsContent>

          <TabsContent value="orders" className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
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
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
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
              <div className="max-w-2xl">
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="nurseryName">Nursery Name</Label>
                    <Input
                      id="nurseryName"
                      value={user?.name || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={user?.address || ""}
                      disabled
                    />
                  </div>
                </form>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}