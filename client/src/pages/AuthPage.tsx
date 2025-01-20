import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, register } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(() => {
    // Get role from URL if it exists
    const params = new URLSearchParams(window.location.search);
    return params.get("role") || "customer";
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await login({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
      });
      setLocation("/");
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    if (formData.get("password") !== formData.get("confirmPassword")) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await register({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as "customer" | "nursery",
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        description: formData.get("description") as string,
        hoursOfOperation: formData.get("hoursOfOperation") as string,
        website: formData.get("website") as string,
        businessLicense: formData.get("businessLicense") as string,
      });
      setLocation("/");
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Switch to registration tab and set role to nursery when directed from Sell on Planted button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "nursery") {
      const tabsList = document.querySelector('[role="tablist"]');
      if (tabsList) {
        const registerTab = tabsList.querySelector('[value="register"]');
        if (registerTab instanceof HTMLElement) {
          registerTab.click();
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 pt-[72px] md:pt-[88px]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Welcome to Planted</CardTitle>
            <CardDescription>
              Connect with local nurseries and find the perfect plants for your space
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      name="role"
                      value={role}
                      onValueChange={setRole}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="nursery">Nursery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      name="username"
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" name="phoneNumber" type="tel" />
                  </div>

                  {role === "nursery" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="description">Business Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Tell us about your nursery..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hoursOfOperation">Hours of Operation</Label>
                        <Input
                          id="hoursOfOperation"
                          name="hoursOfOperation"
                          placeholder="e.g., Mon-Fri 9am-5pm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessLicense">Business License Number</Label>
                        <Input
                          id="businessLicense"
                          name="businessLicense"
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}