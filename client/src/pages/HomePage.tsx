import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/PlantCard";
import { SearchFilters } from "@/components/SearchFilters";
import { CartDrawer } from "@/components/CartDrawer";
import { Loader2, LogOut } from "lucide-react";
import type { Plant } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("20");
  const { user, logout } = useUser();
  const [, setLocation] = useLocation();

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: [`/api/plants?search=${search}&category=${category}&zipCode=${zipCode}&radius=${radius}`],
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary/10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary font-serif">Planted 🌱</h1>
            {user?.role === "nursery" && (
              <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === "customer" && <CartDrawer />}
                <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
                >
                  <LogOut className="h-5 w-5" />
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
          <h2 className="text-4xl md:text-6xl font-bold mb-4 font-serif">
            Discover Local Plants
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Buy local plants from local growers!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1">
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
      <footer className="bg-primary/5 border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">About Planted</h3>
              <p className="text-sm text-muted-foreground">
                Connecting local plant enthusiasts with nurseries to create greener spaces.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="text-muted-foreground hover:text-primary">
                    Join Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Have questions? Email us at<br />
                <a href="mailto:hello@planted.com" className="text-primary hover:underline">
                  hello@planted.com
                </a>
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Planted. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}