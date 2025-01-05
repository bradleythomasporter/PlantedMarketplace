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
import { ChevronDown } from "lucide-react";
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
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
      scrolled 
        ? "bg-background/95 backdrop-blur-sm shadow-sm" 
        : "bg-primary/10"
    )}>
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-4">
          <h1 
            className="text-2xl font-bold text-primary text-display cursor-pointer" 
            onClick={() => setLocation("/")}
          >
            Planted 🌱
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Categories <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.value}
                  onClick={() => setLocation(`/?category=${category.value}`)}
                >
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "nursery" && (
                <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </Button>
              )}
              <span className="text-sm hidden md:inline">
                Welcome, {user.name}
              </span>
              <CartDrawer />
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <CartDrawer />
              <Button variant="outline" onClick={() => setLocation("/auth")}>
                Login
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}