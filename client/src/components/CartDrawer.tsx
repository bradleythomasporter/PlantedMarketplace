import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, total, clearCart } = useCart();
  const { user } = useUser();
  const { toast } = useToast();

  const handleCheckout = () => {
    toast({
      title: "Coming Soon!",
      description: "Checkout functionality will be available in a future update.",
    });
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
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
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
                    <p className="text-sm text-muted-foreground">
                      ${Number(item.plant.price).toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.plant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={!user}
            >
              Checkout (Coming Soon)
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}