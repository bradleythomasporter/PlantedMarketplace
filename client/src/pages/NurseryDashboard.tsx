import { useState } from "react";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Upload, BarChart2, DollarSign, Package2 } from "lucide-react";
import type { Plant } from "@db/schema";
import { PlantCard } from "@/components/PlantCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Progress } from "@/components/ui/progress";

const plantFormSchema = z.object({
  common_name: z.string().min(1, "Plant name is required"),
  scientific_name: z.string().min(1, "Scientific name is required"),
  description: z.string().min(1, "Description is required"),
  care_instructions: z.string().min(1, "Care instructions are required"),
  planting_instructions: z.string().optional(),
  light_requirement: z.enum(["low", "medium", "high"]),
  water_requirement: z.enum(["low", "medium", "high"]),
  temperature_min: z.number().min(-20).max(50),
  temperature_max: z.number().min(-20).max(50),
  humidity_requirement: z.number().min(0).max(100),
  soil_type: z.string(),
  fertilizer_requirements: z.string(),
  mature_height: z.number().positive(),
  mature_spread: z.number().positive(),
  growth_rate: z.enum(["slow", "medium", "fast"]),
  time_to_maturity: z.string(),
  hardiness_zone: z.string(),
  native_region: z.string(),
  price: z.number().positive(),
  quantity: z.number().nonnegative(),
  drought_tolerant: z.boolean(),
  deer_resistant: z.boolean(),
  pest_resistant: z.boolean(),
  edible: z.boolean(),
  indoor_suitable: z.boolean(),
  main_image: z.any(),
});

export default function NurseryDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCsvInstructions, setShowCsvInstructions] = useState(false);
  const queryClient = new QueryClient();

  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: orderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    averageOrderValue: 0,
    recentOrders: []
  }, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/orders/stats'],
    enabled: !!user?.id,
  });

  const form = useForm<z.infer<typeof plantFormSchema>>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      drought_tolerant: false,
      deer_resistant: false,
      pest_resistant: false,
      edible: false,
      indoor_suitable: false,
    },
  });

  const handleAddPlant = async (data: z.infer<typeof plantFormSchema>) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "main_image" && value instanceof FileList) {
          formData.append(key, value[0]);
        } else {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch("/api/plants", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
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

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      fetch("/api/plants/upload-csv", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
        .then(response => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then(data => {
          clearInterval(interval);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 1000);

          toast({
            title: "Plants imported successfully",
            description: `${data.count} plants were imported`,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        })
        .catch(error => {
          clearInterval(interval);
          setUploadProgress(0);
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
      <main className="pt-[72px] md:pt-[88px] flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-6">Manage Plants</h2>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setIsAddingPlant(true)}>
                    Add New Plant
                  </Button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowCsvInstructions(true)}
                      >
                        CSV Instructions
                      </Button>
                    </div>
                    {uploadProgress > 0 && (
                      <Progress value={uploadProgress} className="w-full mt-2" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {isLoadingPlants ? (
                  <div className="flex justify-center py-12">
                    {/* Add a loading spinner here */}
                  </div>
                ) : (
                  plants.map((plant) => (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      variant="inventory"
                      onEdit={() => setSelectedPlant(plant)}
                      onDelete={() => {
                        toast({
                          title: "Not implemented",
                          description: "Delete functionality coming soon",
                        });
                      }}
                    />
                  ))
                )}

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
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Orders
                    </CardTitle>
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {orderStats.pendingOrders} pending
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${orderStats.revenue?.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. ${orderStats.averageOrderValue?.toFixed(2)} per order
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {orderStats.recentOrders?.map((order: any) => (
                      <div key={order.id} className="flex items-center">
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {order.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${order.total.toFixed(2)} • {order.items} items
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          {order.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <div className="py-12 text-center text-muted-foreground">
                Profile settings coming soon
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={isAddingPlant} onOpenChange={setIsAddingPlant}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Plant</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddPlant)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="common_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Common Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scientific_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scientific Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="care_instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Care Instructions</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="planting_instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Planting Instructions</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="light_requirement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Light Requirement</FormLabel>
                          <FormControl>
                            <Select {...field}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="water_requirement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Water Requirement</FormLabel>
                          <FormControl>
                            <Select {...field}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="temperature_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="temperature_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="humidity_requirement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Humidity Requirement (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="soil_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soil Type</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fertilizer_requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fertilizer Requirements</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mature_height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mature Height (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mature_spread"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mature Spread (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="growth_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Growth Rate</FormLabel>
                          <FormControl>
                            <Select {...field}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="slow">Slow</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="fast">Fast</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time_to_maturity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time to Maturity</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hardiness_zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hardiness Zone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="native_region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Native Region</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drought_tolerant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drought Tolerant</FormLabel>
                          <FormControl>
                            <Switch {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deer_resistant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deer Resistant</FormLabel>
                          <FormControl>
                            <Switch {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pest_resistant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pest Resistant</FormLabel>
                          <FormControl>
                            <Switch {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="edible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edible</FormLabel>
                          <FormControl>
                            <Switch {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="indoor_suitable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indoor Suitable</FormLabel>
                          <FormControl>
                            <Switch {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <div className="col-span-2">
                      <Button type="submit" className="w-full">
                        Add Plant
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCsvInstructions} onOpenChange={setShowCsvInstructions}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>CSV Import Instructions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To import plants using a CSV file, please follow these guidelines:
                </p>
                <div className="space-y-2">
                  <h3 className="font-medium">Required Fields:</h3>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>common_name (text)</li>
                    <li>scientific_name (text)</li>
                    <li>description (text)</li>
                    <li>price (number)</li>
                    <li>quantity (number)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Optional Fields:</h3>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>care_instructions (text)</li>
                    <li>planting_instructions (text)</li>
                    <li>light_requirement (low/medium/high)</li>
                    <li>water_requirement (low/medium/high)</li>
                    <li>temperature_min (number)</li>
                    <li>temperature_max (number)</li>
                    <li>humidity_requirement (number, 0-100)</li>
                    <li>soil_type (text)</li>
                    <li>fertilizer_requirements (text)</li>
                    <li>mature_height (number, cm)</li>
                    <li>mature_spread (number, cm)</li>
                    <li>growth_rate (slow/medium/fast)</li>
                    <li>time_to_maturity (text)</li>
                    <li>hardiness_zone (text)</li>
                    <li>native_region (text)</li>
                    <li>drought_tolerant (true/false)</li>
                    <li>deer_resistant (true/false)</li>
                    <li>pest_resistant (true/false)</li>
                    <li>edible (true/false)</li>
                    <li>indoor_suitable (true/false)</li>
                  </ul>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Here you would add logic to download a sample CSV
                      toast({
                        title: "Sample CSV",
                        description: "Sample CSV download functionality coming soon",
                      });
                    }}
                  >
                    Download Sample CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}