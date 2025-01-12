import { create } from 'zustand';
import type { Plant } from '@db/schema';

interface CartItem {
  plant: Plant;
  quantity: number;
  requiresPlanting: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (plant: Plant, quantity: number, requiresPlanting?: boolean) => void;
  removeItem: (plantId: number) => void;
  updateQuantity: (plantId: number, quantity: number) => void;
  updatePlantingService: (plantId: number, requiresPlanting: boolean) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  plantingServiceFee: () => number;
  total: () => number;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce(
    (total, item) => total + Number(item.plant.price) * item.quantity,
    0
  );
};

const calculatePlantingServiceFee = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    return total + (item.requiresPlanting ? 49.99 * item.quantity : 0);
  }, 0);
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (plant, quantity, requiresPlanting = false) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.plant.id === plant.id);

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.plant.id === plant.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { plant, quantity, requiresPlanting }],
      };
    });
  },

  removeItem: (plantId) => {
    set((state) => ({
      items: state.items.filter((item) => item.plant.id !== plantId),
    }));
  },

  updateQuantity: (plantId, quantity) => {
    if (quantity < 1) return;

    set((state) => ({
      items: state.items.map((item) =>
        item.plant.id === plantId ? { ...item, quantity } : item
      ),
    }));
  },

  updatePlantingService: (plantId, requiresPlanting) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.plant.id === plantId ? { ...item, requiresPlanting } : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  totalItems: () => {
    const items = get().items;
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  subtotal: () => {
    const items = get().items;
    return calculateSubtotal(items);
  },

  plantingServiceFee: () => {
    const items = get().items;
    return calculatePlantingServiceFee(items);
  },

  total: () => {
    const items = get().items;
    return calculateSubtotal(items) + calculatePlantingServiceFee(items);
  },
}));