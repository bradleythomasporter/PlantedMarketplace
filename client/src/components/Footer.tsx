import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Sprout } from "lucide-react";
import { useLocation } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [, setLocation] = useLocation();

  const handleSellOnPlanted = () => {
    setLocation('/auth?role=nursery');
  };

  return (
    <footer className="bg-primary/5 border-t">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-display">Planted 🌱</h3>
            <p className="text-sm text-muted-foreground">
              Your local plant marketplace connecting gardeners with nurseries.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Button variant="link" className="h-auto p-0">About Us</Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0">Plant Care Guides</Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0">Nursery Locations</Button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Button variant="link" className="h-auto p-0">Contact Us</Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0">FAQs</Button>
              </li>
              <li>
                <Button variant="link" className="h-auto p-0">Shipping Info</Button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Grow With Us</h4>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleSellOnPlanted}
              >
                <Sprout className="h-4 w-4" />
                Sell on Planted
              </Button>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Planted. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}