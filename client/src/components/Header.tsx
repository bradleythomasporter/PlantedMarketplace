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

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();

  const categories = [
    { label: "All Plants", value: "all" },
    { label: "Flowers", value: "flowers" },
    { label: "Trees", value: "trees" },
    { label: "Shrubs", value: "shrubs" },
    { label: "Indoor", value: "indoor" },
    { label: "Outdoor", value: "outdoor" },
  ];

  return (
    <header className="bg-primary/10 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
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