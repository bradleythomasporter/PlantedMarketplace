import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  LeafyGreen, 
  MapPin, 
  Sun, 
  Droplets, 
  ThermometerSun,
  Ruler,
  Calendar,
  Scale,
  Info,
  Share2,
  Facebook,
  Twitter,
  Mail
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/lib/cart-store";
import { SimilarPlants } from "@/components/SimilarPlants";
import { ReviewSection } from "@/components/ReviewSection";
import type { Plant } from "@db/schema";

// Add to recently viewed plants in localStorage
function addToRecentlyViewed(plant: Plant) {
  try {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updated = [plant, ...recentlyViewed.filter((p: Plant) => p.id !== plant.id)].slice(0, 4);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating recently viewed:', error);
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cartStore = useCartStore();
  const [showGardenerModal, setShowGardenerModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);

  const { data: plant, isLoading } = useQuery<Plant>({
    queryKey: [`/api/plants/${params.id}`],
  });

  useEffect(() => {
    if (plant) {
      addToRecentlyViewed(plant);
    }
  }, [plant]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${plant?.name} on Planted!`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${text}&body=${url}`, '_blank');
        break;
    }
  };

  const handleAddToCart = () => {
    if (plant) {
      cartStore.addItem(plant, 1);
      toast({
        title: "Added to Cart",
        description: `${plant.name} has been added to your cart.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[72px] md:pt-[88px] flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[72px] md:pt-[88px] text-center py-12">
          <p className="text-lg text-muted-foreground">Plant not found</p>
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

      <div className="pt-[72px] md:pt-[88px]">
        <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery Section */}
            <div className="space-y-4">
              <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
                <DialogTrigger asChild>
                  <div className="aspect-square rounded-lg overflow-hidden bg-white cursor-zoom-in">
                    <img
                      src={selectedImage || plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{plant.name}</DialogTitle>
                  </DialogHeader>
                  <div className="aspect-square">
                    <img
                      src={selectedImage || plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              {plant.additionalImages && plant.additionalImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  <div 
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${!selectedImage ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(null)}
                  >
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {plant.additionalImages.map((img, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${selectedImage === img ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`${plant.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Share Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare('facebook')}
                  className="hover:text-blue-600"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="hover:text-blue-400"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare('email')}
                  className="hover:text-red-500"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-display mb-2">{plant.name}</h1>
                <Button 
                  variant="link" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                  onClick={() => setLocation(`/nurseries/${plant.nurseryId}`)}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Visit Nursery Profile</span>
                </Button>
                <p className="text-2xl font-semibold mt-4">
                  ${Number(plant.price).toFixed(2)}
                </p>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {plant.height && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-primary" />
                    <span>Height: {plant.height}</span>
                  </div>
                )}
                {plant.spread && (
                  <div className="flex items-center gap-2 text-sm">
                    <Scale className="h-4 w-4 text-primary" />
                    <span>Spread: {plant.spread}</span>
                  </div>
                )}
                {plant.sunExposure && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="h-4 w-4 text-primary" />
                    <span>{plant.sunExposure}</span>
                  </div>
                )}
                {plant.wateringNeeds && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-4 w-4 text-primary" />
                    <span>{plant.wateringNeeds}</span>
                  </div>
                )}
                {plant.hardinessZone && (
                  <div className="flex items-center gap-2 text-sm">
                    <ThermometerSun className="h-4 w-4 text-primary" />
                    <span>Zone: {plant.hardinessZone}</span>
                  </div>
                )}
                {plant.floweringSeason && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{plant.floweringSeason}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleAddToCart}>
                  Add to Cart
                </Button>

                <Dialog open={showGardenerModal} onOpenChange={setShowGardenerModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="lg">
                      <LeafyGreen className="mr-2 h-4 w-4" />
                      Request Professional Planting
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Professional Planting Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Our certified Planted gardeners will plant this {plant.name} in your garden,
                        ensuring optimal placement and care instructions.
                      </p>
                      <Card className="p-4">
                        <p className="font-semibold">Service includes:</p>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li>• Professional planting by certified gardener</li>
                          <li>• Soil assessment and preparation</li>
                          <li>• Care instructions and 30-day guarantee</li>
                          <li>• Follow-up maintenance tips</li>
                        </ul>
                      </Card>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          cartStore.addItem(plant, 1, true);
                          toast({
                            title: "Added to Cart",
                            description: `${plant.name} with planting service has been added to your cart.`,
                          });
                          setShowGardenerModal(false);
                        }}
                      >
                        Add to Cart (+$49.99)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                  <TabsTrigger value="care" className="flex-1">Care Guide</TabsTrigger>
                  <TabsTrigger value="planting" className="flex-1">Planting</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <div className="prose prose-stone dark:prose-invert">
                    <p>{plant.description}</p>
                    {plant.matureSize && (
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold">Mature Size</h4>
                        <p>{plant.matureSize}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="care" className="mt-4">
                  <div className="prose prose-stone dark:prose-invert">
                    {plant.careInstructions && (
                      <div dangerouslySetInnerHTML={{ __html: plant.careInstructions }} />
                    )}
                    <div className="mt-4 space-y-4">
                      {plant.soilType && (
                        <div>
                          <h4 className="text-lg font-semibold">Soil Requirements</h4>
                          <p>{plant.soilType}</p>
                        </div>
                      )}
                      {plant.wateringNeeds && (
                        <div>
                          <h4 className="text-lg font-semibold">Watering</h4>
                          <p>{plant.wateringNeeds}</p>
                        </div>
                      )}
                      {plant.sunExposure && (
                        <div>
                          <h4 className="text-lg font-semibold">Light Requirements</h4>
                          <p>{plant.sunExposure}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="planting" className="mt-4">
                  <div className="prose prose-stone dark:prose-invert">
                    {plant.plantingInstructions ? (
                      <div dangerouslySetInnerHTML={{ __html: plant.plantingInstructions }} />
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <p>Book our professional planting service for expert guidance and installation.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                  <ReviewSection plantId={plant.id} />
                </TabsContent>
              </Tabs>

              {/* Seasonal Information */}
              {plant.seasonalAvailability && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Seasonal Information</h3>
                  <p className="text-sm text-muted-foreground">{plant.seasonalAvailability}</p>
                </Card>
              )}
            </div>
          </div>

          {/* Similar Plants Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar Plants</h2>
            <SimilarPlants currentPlant={plant} />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}