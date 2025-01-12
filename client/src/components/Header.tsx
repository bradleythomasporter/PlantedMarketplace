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
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
          : "bg-gradient-to-b from-emerald-50/90 to-background/0 dark:from-emerald-950/90"
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer mr-8" 
            onClick={() => setLocation("/")}
          >
            <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">
              Planted
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
              className="font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              onClick={() => setLocation("/about")}
            >
              About
            </Button>

            <Button 
              variant="ghost" 
              className="font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
                    className="font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
                  className="shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
                  className="shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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