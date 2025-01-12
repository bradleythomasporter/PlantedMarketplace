import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { CartDrawer } from "./CartDrawer";
import { ChevronDown, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();
  const [scrolled, setScrolled] = useState(false);

  const categories = [
    { label: "All Plants", value: "all" },
    { label: "Flowers", value: "flowers" },
    { label: "Trees", value: "trees" },
    { label: "Shrubs", value: "shrubs" },
    { label: "Indoor", value: "indoor" },
    { label: "Outdoor", value: "outdoor" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled 
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-gradient-to-b from-primary/20 to-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-border/40">
          <div className="flex h-16 items-center px-4 md:px-6">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer mr-8" 
              onClick={() => setLocation("/")}
            >
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                Planted
              </h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 font-medium hover:bg-primary/10"
                  >
                    Shop <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.value}
                      onClick={() => setLocation(`/?category=${category.value}`)}
                      className="cursor-pointer"
                    >
                      {category.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                className="font-medium hover:bg-primary/10"
                onClick={() => setLocation("/about")}
              >
                About
              </Button>

              <Button 
                variant="ghost" 
                className="font-medium hover:bg-primary/10"
                onClick={() => setLocation("/contact")}
              >
                Contact
              </Button>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {user.role === "nursery" && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setLocation("/dashboard")}
                      className="font-medium hover:bg-primary/10"
                    >
                      Dashboard
                    </Button>
                  )}
                  <span className="text-sm hidden md:inline font-medium">
                    Welcome, {user.name}
                  </span>
                  <CartDrawer />
                  <Button 
                    variant="outline" 
                    onClick={() => logout()}
                    className="shadow-sm hover:bg-primary/10"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <CartDrawer />
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/auth")}
                    className="shadow-sm hover:bg-primary/10"
                  >
                    Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}