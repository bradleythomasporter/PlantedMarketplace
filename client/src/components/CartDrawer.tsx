import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Trash2, Plus, Minus, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = (plantId: number, currentQuantity: number, increment: boolean) => {
    const newQuantity = increment ? currentQuantity + 1 : currentQuantity - 1;
    if (newQuantity >= 1) {
      updateQuantity(plantId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setOpen(false);
      setLocation("/auth");
      return;
    }

    try {
      setIsCheckingOut(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map(item => ({
            plantId: item.plant.id,
            quantity: item.quantity,
            requiresPlanting: item.requiresPlanting,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Checkout failed");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "There was a problem processing your checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="space-y-2.5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-1">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Your cart is empty
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.plant.id}
                      className="flex items-center gap-4 border-b pb-4"
                    >
                      <img
                        src={item.plant.imageUrl}
                        alt={item.plant.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.plant.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ${Number(item.plant.price).toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.plant.id, item.quantity, false)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.plant.id, item.quantity, true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-semibold">
                          ${(Number(item.plant.price) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeItem(item.plant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 mt-auto">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              onClick={handleCheckout}
              disabled={isCheckingOut || !user}
            >
              {isCheckingOut ? (
                "Processing..."
              ) : !user ? (
                "Login to Checkout"
              ) : (
                "Checkout"
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}