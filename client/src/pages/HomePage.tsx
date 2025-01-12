import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/PlantCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import type { Plant } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("20");
  const { user } = useUser();
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract category from URL
  const category = new URLSearchParams(location.split('?')[1]).get('category') || 'all';

  // Handle search and filter logic
  const { data: plants = [], isLoading, error } = useQuery<Plant[]>({
    queryKey: [`/api/plants?search=${search}&category=${category}&zipCode=${zipCode}&radius=${radius}`],
    enabled: !zipCode || zipCode.length === 5, // Only enable if no ZIP code or if it's valid
    retry: false,
  });

  // Show error toast if the search fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Search Error",
        description: "Failed to load plants. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Add top padding to account for fixed header */}
      <div className="pt-[72px] md:pt-[88px]">
        {/* Hero Section */}
        <section className="bg-primary/10 py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-display">
              Discover Local Plants
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Buy local plants from local growers!
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchFilters
                search={search}
                zipCode={zipCode}
                radius={radius}
                onSearchChange={setSearch}
                onZipCodeChange={setZipCode}
                onRadiusChange={setRadius}
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : plants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {zipCode && zipCode.length !== 5 
                  ? "Please enter a valid 5-digit ZIP code"
                  : "No plants found. Try adjusting your search or location."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}