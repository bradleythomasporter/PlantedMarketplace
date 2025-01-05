import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/PlantCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Loader2 } from "lucide-react";
import type { Plant } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("20");
  const { user } = useUser();

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: [`/api/plants?search=${search}&category=${category}&zipCode=${zipCode}&radius=${radius}`],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Planted 🌱</h1>
          <div className="flex gap-2">
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <Link href={user.role === 'nursery' ? '/dashboard' : '/profile'}>
                    {user.role === 'nursery' ? 'Nursery Dashboard' : 'Profile'}
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/auth">Login / Register</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Local Plants
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Buy local plants from local growers!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <SearchFilters
          search={search}
          category={category}
          zipCode={zipCode}
          radius={radius}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onZipCodeChange={setZipCode}
          onRadiusChange={setRadius}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No plants found. Try adjusting your search or location.
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

      {/* Footer */}
      <footer className="bg-muted mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Planted. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}