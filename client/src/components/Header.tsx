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
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-200",
        scrolled 
          ? "bg-white shadow-md" 
          : "bg-emerald-600"
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer mr-8" 
            onClick={() => setLocation("/")}
          >
            <Leaf className={cn(
              "h-6 w-6 transition-colors duration-200",
              scrolled ? "text-emerald-600" : "text-white"
            )} />
            <h1 className={cn(
              "text-2xl font-bold tracking-tight transition-colors duration-200",
              scrolled ? "text-emerald-600" : "text-white"
            )}>
              Planted
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={scrolled ? "ghost" : "secondary"}
                  className={cn(
                    "flex items-center gap-1 font-medium transition-colors duration-200",
                    scrolled 
                      ? "text-gray-700 hover:bg-gray-100" 
                      : "text-emerald-600 bg-white hover:bg-white/90"
                  )}
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
              className={cn(
                "font-medium transition-colors duration-200",
                scrolled 
                  ? "text-gray-700 hover:bg-gray-100" 
                  : "text-white hover:bg-emerald-500"
              )}
              onClick={() => setLocation("/about")}
            >
              About
            </Button>

            <Button 
              variant="ghost" 
              className={cn(
                "font-medium transition-colors duration-200",
                scrolled 
                  ? "text-gray-700 hover:bg-gray-100" 
                  : "text-white hover:bg-emerald-500"
              )}
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
                    className={cn(
                      "font-medium transition-colors duration-200",
                      scrolled 
                        ? "text-gray-700 hover:bg-gray-100" 
                        : "text-white hover:bg-emerald-500"
                    )}
                  >
                    Dashboard
                  </Button>
                )}
                <span className={cn(
                  "text-sm hidden md:inline font-medium transition-colors duration-200",
                  scrolled ? "text-gray-700" : "text-white"
                )}>
                  Welcome, {user.name}
                </span>
                <CartDrawer />
                <Button 
                  variant={scrolled ? "outline" : "secondary"}
                  onClick={() => logout()}
                  className={cn(
                    "transition-colors duration-200",
                    scrolled 
                      ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50" 
                      : "bg-white text-emerald-600 hover:bg-white/90"
                  )}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <CartDrawer />
                <Button 
                  variant={scrolled ? "outline" : "secondary"}
                  onClick={() => setLocation("/auth")}
                  className={cn(
                    "transition-colors duration-200",
                    scrolled 
                      ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50" 
                      : "bg-white text-emerald-600 hover:bg-white/90"
                  )}
                >
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}