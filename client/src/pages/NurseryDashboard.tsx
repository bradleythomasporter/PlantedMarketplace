import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Upload } from "lucide-react";
import type { Plant } from "@db/schema";
import { PlantCard } from "@/components/PlantCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  main_image: z.any(), // Will handle file upload separately
});

export default function NurseryDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState("inventory");

  // Fetch inventory
  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
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

              <div className="space-y-2">
                {isLoadingPlants ? (
                  <div className="flex justify-center py-12">
                    {/* Loader here */}
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

            <TabsContent value="orders">
              <div className="py-12 text-center text-muted-foreground">
                Order management coming soon
              </div>
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
                    {/* Add a file upload field for main_image here if needed */}

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
        </div>
      </main>
      <Footer />
    </div>
  );
}