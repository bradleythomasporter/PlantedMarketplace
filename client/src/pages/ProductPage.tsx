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
  Mail,
  Thermometer,
  Sprout,
  Globe,
  Shield,
  Leaf,
  Home,
  CloudRain,
  Bug,
  UtensilsCrossed
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

              {/* Scientific Information Card */}
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide">Botanical Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scientific Name:</span>
                    <span className="italic">{plant.scientificName}</span>
                  </div>
                  {plant.nativeRegion && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Native Region:</span>
                      <span>{plant.nativeRegion}</span>
                    </div>
                  )}
                  {plant.hardinessZone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hardiness Zone:</span>
                      <span>{plant.hardinessZone}</span>
                    </div>
                  )}
                </div>
              </Card>

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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="italic">{plant.scientificName}</span>
                </div>
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

              {/* Plant Characteristics */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Key Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {plant.matureHeight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Height</p>
                        <p className="text-muted-foreground">{plant.matureHeight}cm</p>
                      </div>
                    </div>
                  )}
                  {plant.matureSpread && (
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Spread</p>
                        <p className="text-muted-foreground">{plant.matureSpread}cm</p>
                      </div>
                    </div>
                  )}
                  {plant.growthRate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Sprout className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Growth Rate</p>
                        <p className="text-muted-foreground capitalize">{plant.growthRate}</p>
                      </div>
                    </div>
                  )}
                  {plant.timeToMaturity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Time to Maturity</p>
                        <p className="text-muted-foreground">{plant.timeToMaturity}</p>
                      </div>
                    </div>
                  )}
                  {(plant.temperatureMin || plant.temperatureMax) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Temperature</p>
                        <p className="text-muted-foreground">
                          {plant.temperatureMin}°C to {plant.temperatureMax}°C
                        </p>
                      </div>
                    </div>
                  )}
                  {plant.humidityRequirement && (
                    <div className="flex items-center gap-2 text-sm">
                      <CloudRain className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">Humidity</p>
                        <p className="text-muted-foreground">{plant.humidityRequirement}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Plant Properties */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Properties</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {plant.indoorSuitable && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <Home className="h-5 w-5 text-primary" />
                      <span className="text-xs">Indoor Suitable</span>
                    </div>
                  )}
                  {plant.droughtTolerant && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <Sun className="h-5 w-5 text-primary" />
                      <span className="text-xs">Drought Tolerant</span>
                    </div>
                  )}
                  {plant.deerResistant && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-xs">Deer Resistant</span>
                    </div>
                  )}
                  {plant.pestResistant && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <Bug className="h-5 w-5 text-primary" />
                      <span className="text-xs">Pest Resistant</span>
                    </div>
                  )}
                  {plant.fragrant && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <Leaf className="h-5 w-5 text-primary" />
                      <span className="text-xs">Fragrant</span>
                    </div>
                  )}
                  {plant.edible && (
                    <div className="flex flex-col items-center gap-2 text-center p-2 rounded-lg bg-primary/5">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                      <span className="text-xs">Edible</span>
                    </div>
                  )}
                </div>
              </Card>

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
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Light Requirements</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plant.lightRequirement === 'low' && 'Thrives in low light conditions, perfect for shaded areas.'}
                            {plant.lightRequirement === 'medium' && 'Prefers bright, indirect light for optimal growth.'}
                            {plant.lightRequirement === 'high' && 'Requires full sun exposure for best results.'}
                          </p>
                        </Card>

                        <Card className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Droplets className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">Watering Needs</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plant.waterRequirement === 'low' && 'Drought-tolerant, requires minimal watering.'}
                            {plant.waterRequirement === 'medium' && 'Keep soil consistently moist but not waterlogged.'}
                            {plant.waterRequirement === 'high' && 'Requires frequent watering to maintain moisture.'}
                          </p>
                        </Card>

                        {plant.soilType && (
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sprout className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">Soil Type</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{plant.soilType}</p>
                          </Card>
                        )}

                        {plant.fertilizerRequirements && (
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <LeafyGreen className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">Fertilizer</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{plant.fertilizerRequirements}</p>
                          </Card>
                        )}
                      </div>

                      {plant.careInstructions && (
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold mb-3">Additional Care Instructions</h4>
                          <div className="prose prose-sm max-w-none text-muted-foreground" 
                               dangerouslySetInnerHTML={{ __html: plant.careInstructions }} 
                          />
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
              {(plant.seasonalAvailability || plant.floweringSeason || plant.fruitingSeason) && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Seasonal Information</h3>
                  <div className="space-y-3">
                    {plant.floweringSeason && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Flowering Season</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {plant.floweringSeason}
                            {plant.floweringColor && ` - ${plant.floweringColor} flowers`}
                          </p>
                        </div>
                      </div>
                    )}
                    {plant.fruitingSeason && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Fruiting Season</p>
                          <p className="text-sm text-muted-foreground capitalize">{plant.fruitingSeason}</p>
                        </div>
                      </div>
                    )}
                    {plant.seasonalAvailability && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Availability</p>
                          <p className="text-sm text-muted-foreground">{plant.seasonalAvailability}</p>
                        </div>
                      </div>
                    )}
                  </div>
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