import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // product id
  slug?: string;
  cartItemId?: string; // unique instance id for distinct variations
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
  selectedSize?: { name: string; price: number };
  selectedAddOns?: Array<{ name: string; price: number }>;
  customNotes?: string;
}

interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => { success: boolean; requiresConfirmation: boolean };
  confirmAndReplaceCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (idOrCartItemId: string) => void;
  updateQuantity: (idOrCartItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotal: () => number;
  getItemCount: () => number;
}

function generateCartKey(item: Omit<CartItem, "quantity">): string {
  const sizeKey = item.selectedSize ? item.selectedSize.name : "default";
  const addOnsKey = item.selectedAddOns && item.selectedAddOns.length > 0 
    ? item.selectedAddOns.map(a => a.name).sort().join(",") 
    : "none";
  return `${item.id}-${sizeKey}-${addOnsKey}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,

      addItem: (newItem, quantity = 1) => {
        const { items, vendorId } = get();

        // Check if cart has items from a different vendor
        if (vendorId && vendorId !== newItem.vendorId && items.length > 0) {
          return { success: false, requiresConfirmation: true };
        }

        const instanceKey = newItem.cartItemId || generateCartKey(newItem);
        const itemWithKey: CartItem = {
          ...newItem,
          cartItemId: instanceKey,
          quantity: quantity > 0 ? quantity : 1,
        };

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => (i.cartItemId || i.id) === instanceKey
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + (quantity > 0 ? quantity : 1),
            };
            return {
              ...state,
              items: updatedItems,
              vendorId: newItem.vendorId,
              vendorName: newItem.vendorName,
            };
          }

          return {
            ...state,
            items: [...state.items, itemWithKey],
            vendorId: newItem.vendorId,
            vendorName: newItem.vendorName,
          };
        });

        return { success: true, requiresConfirmation: false };
      },

      confirmAndReplaceCart: (newItem, quantity = 1) => {
        const instanceKey = newItem.cartItemId || generateCartKey(newItem);
        set({
          items: [{ ...newItem, cartItemId: instanceKey, quantity: quantity > 0 ? quantity : 1 }],
          vendorId: newItem.vendorId,
          vendorName: newItem.vendorName,
        });
      },

      removeItem: (idOrCartItemId) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => i.cartItemId !== idOrCartItemId && i.id !== idOrCartItemId
          );
          return {
            ...state,
            items: newItems,
            vendorId: newItems.length === 0 ? null : state.vendorId,
            vendorName: newItems.length === 0 ? null : state.vendorName,
          };
        });
      },

      updateQuantity: (idOrCartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(idOrCartItemId);
          return;
        }
        set((state) => ({
          ...state,
          items: state.items.map((i) =>
            (i.cartItemId || i.id) === idOrCartItemId ? { ...i, quantity } : i
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
