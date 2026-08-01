import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
}

interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => { success: boolean; requiresConfirmation: boolean };
  confirmAndReplaceCart: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,

      addItem: (newItem) => {
        const { items, vendorId } = get();

        // Check if cart has items from a different vendor
        if (vendorId && vendorId !== newItem.vendorId && items.length > 0) {
          return { success: false, requiresConfirmation: true };
        }

        set((state) => {
          const existingItem = state.items.find((i) => i.id === newItem.id);
          if (existingItem) {
            return {
              ...state,
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
              vendorId: newItem.vendorId,
              vendorName: newItem.vendorName,
            };
          }

          return {
            ...state,
            items: [...state.items, { ...newItem, quantity: 1 }],
            vendorId: newItem.vendorId,
            vendorName: newItem.vendorName,
          };
        });

        return { success: true, requiresConfirmation: false };
      },

      confirmAndReplaceCart: (newItem) => {
        set({
          items: [{ ...newItem, quantity: 1 }],
          vendorId: newItem.vendorId,
          vendorName: newItem.vendorName,
        });
      },

      removeItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== id);
          return {
            ...state,
            items: newItems,
            vendorId: newItems.length === 0 ? null : state.vendorId,
            vendorName: newItems.length === 0 ? null : state.vendorName,
          };
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          ...state,
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], vendorId: null, vendorName: null });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "campus-cart-storage",
    }
  )
);
