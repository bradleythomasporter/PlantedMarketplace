import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

export function Header() {
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();

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
          <Button variant="ghost" onClick={() => setLocation("/")}>
            Browse Plants
          </Button>
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
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setLocation("/auth")}>
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
