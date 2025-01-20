import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Upload, Loader2 } from "lucide-react";
import type { Plant } from "@db/schema";
import { PlantCard } from "@/components/PlantCard";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";


const plantCategories = [
  { value: 'perennials', label: 'Perennials' },
  { value: 'annuals', label: 'Annuals' },
  { value: 'shrubs', label: 'Shrubs' },
  { value: 'trees', label: 'Trees' },
  { value: 'vines', label: 'Vines' },
  { value: 'indoor', label: 'Indoor Plants' },
  { value: 'succulents', label: 'Succulents & Cacti' },
  { value: 'herbs', label: 'Herbs' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'grasses', label: 'Ornamental Grasses' },
] as const;


export default function NurseryDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    data: plants = [],
    isLoading: isLoadingPlants
  } = useQuery<Plant[]>({
    queryKey: [`/api/inventory?nurseryId=${user?.id}`],
    enabled: !!user?.id,
  });

  const {
    data: stats = {
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      recentOrders: []
    }
  } = useQuery({
    queryKey: ['/api/orders/stats'],
    enabled: !!user?.id,
  });

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
            title: "Success",
            description: `${data.count} plants were imported`,
          });
        })
        .catch(error => {
          clearInterval(interval);
          setUploadProgress(0);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Manage Plants</h2>
            <div className="flex gap-4">
              <Button>
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
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="w-full mt-2" />
                )}
              </div>
            </div>
          </div>

          {isLoadingPlants ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map((plant) => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  variant="inventory"
                  onEdit={() => {
                    toast({
                      title: "Not implemented",
                      description: "Edit functionality coming soon",
                    });
                  }}
                  onDelete={() => {
                    toast({
                      title: "Not implemented",
                      description: "Delete functionality coming soon",
                    });
                  }}
                />
              ))}

              {plants.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No plants in inventory</p>
                  <Button
                    variant="link"
                    onClick={() => {}}
                    className="mt-2"
                  >
                    Add your first plant
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2">Total Orders</h3>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2">Pending Orders</h3>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold">
                  ${stats.totalRevenue?.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Recent Orders</h3>
              <div className="space-y-6">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          ${order.total.toFixed(2)} • {order.items} items
                        </p>
                      </div>
                      <div className="text-sm font-medium">{order.status}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}