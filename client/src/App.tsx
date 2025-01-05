import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import NurseryDashboard from "./pages/NurseryDashboard";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      {user.role === "nursery" && (
        <Route path="/dashboard" component={NurseryDashboard} />
      )}
      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  );
}

export default AppWrapper;
