import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PlantCard } from "@/components/PlantCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Phone } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { Plant, User } from "@db/schema";

export default function NurseryProfile({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();

  const { data: nursery, isLoading: isLoadingNursery } = useQuery<User>({
    queryKey: [`/api/nurseries/${params.id}`],
  });

  const { data: plants = [], isLoading: isLoadingPlants } = useQuery<Plant[]>({
    queryKey: [`/api/plants?nurseryId=${params.id}`],
  });

  if (isLoadingNursery || isLoadingPlants) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!nursery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Nursery not found</p>
          <Button variant="link" onClick={() => setLocation("/")}>
            Return to Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Nursery Header */}
        <div className="bg-primary/5 py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h1 className="text-4xl font-bold text-display mb-4">{nursery.name}</h1>
            <div className="flex flex-col gap-2 text-muted-foreground">
              {nursery.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {nursery.address}
                </p>
              )}
              {nursery.hoursOfOperation && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {nursery.hoursOfOperation}
                </p>
              )}
            </div>
            {nursery.description && (
              <p className="mt-4 text-lg">{nursery.description}</p>
            )}
          </div>
        </div>

        {/* Plants Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-2xl font-bold text-display mb-8">Available Plants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>

          {plants.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No plants available at the moment
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
