import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/lib/cart-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
    toast({
      title: "Payment Successful",
      description: "Thank you for your purchase! We'll process your order soon.",
    });
  }, [clearCart, toast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was successful and your order has been placed.
            You'll receive an email confirmation shortly.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckoutCancelPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Checkout Cancelled",
      description: "Your order has been cancelled. No payment was processed.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            Your order has been cancelled and no payment was processed.
            Your cart items are still saved if you'd like to try again.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Return to Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
