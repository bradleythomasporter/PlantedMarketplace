import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import NurseryDashboard from "./pages/NurseryDashboard";
import ProductPage from "./pages/ProductPage";
import NurseryProfile from "./pages/NurseryProfile";
import { CheckoutSuccessPage, CheckoutCancelPage } from "./pages/CheckoutResult";
import { useUser } from "@/hooks/use-user";

function App() {
  const { user } = useUser();

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/plants/:id" component={ProductPage} />
      <Route path="/nurseries/:id" component={NurseryProfile} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/checkout/cancel" component={CheckoutCancelPage} />
      {user?.role === "nursery" && (
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