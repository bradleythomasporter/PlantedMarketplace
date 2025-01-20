import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function NurseryDashboard() {
  const { user } = useUser();

  const { data: stats = {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  }} = useQuery({
    queryKey: ['/api/orders/stats'],
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

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
                {stats.recentOrders?.length > 0 ? (
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

        <TabsContent value="inventory">
          <div className="text-center py-12 text-muted-foreground">
            Inventory management coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}