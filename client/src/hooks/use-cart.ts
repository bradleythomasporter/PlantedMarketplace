import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plant } from '@db/schema';

type CartItem = {
  plant: Plant;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (plant: Plant, quantity: number) => void;
  removeItem: (plantId: number) => void;
  updateQuantity: (plantId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (plant, quantity) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.plant.id === plant.id
          );
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
            items: [...state.items, { plant, quantity }],
          };
        });
      },
      removeItem: (plantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.plant.id !== plantId),
        }));
      },
      updateQuantity: (plantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.plant.id === plantId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      total: () => {
        return get().items.reduce(
          (total, item) => total + Number(item.plant.price) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'planted-cart',
    }
  )
);
