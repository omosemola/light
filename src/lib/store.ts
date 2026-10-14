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
  vendorDeliveryFee?: number;
  vendorEstimatedDelivery?: string;
  itemDeliveryFee?: number | null;
  itemEstimatedDelivery?: string | null;
  selectedSize?: { name: string; price: number };
  selectedAddOns?: Array<{ name: string; price: number }>;
  customNotes?: string;
}

interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  vendorDeliveryFee: number;
  vendorEstimatedDelivery: string;
  
  // Actions
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => { success: boolean; requiresConfirmation: boolean };
  confirmAndReplaceCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (idOrCartItemId: string) => void;
  updateQuantity: (idOrCartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setVendorDeliveryDetails: (deliveryFee: number, estimatedDelivery?: string) => void;
  
  // Computed
  getTotal: () => number;
  getDeliveryFee: () => number;
  getEstimatedDelivery: () => string;
  getPlatformFee: () => number;
  getGrandTotal: () => number;
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
      vendorDeliveryFee: 500,
      vendorEstimatedDelivery: "20-35 mins",

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

        const nextDeliveryFee = newItem.vendorDeliveryFee !== undefined ? newItem.vendorDeliveryFee : get().vendorDeliveryFee ?? 500;
        const nextEstimatedDelivery = newItem.vendorEstimatedDelivery || get().vendorEstimatedDelivery || "20-35 mins";

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
              vendorDeliveryFee: nextDeliveryFee,
              vendorEstimatedDelivery: nextEstimatedDelivery,
            };
          }

          return {
            ...state,
            items: [...state.items, itemWithKey],
            vendorId: newItem.vendorId,
            vendorName: newItem.vendorName,
            vendorDeliveryFee: nextDeliveryFee,
            vendorEstimatedDelivery: nextEstimatedDelivery,
          };
        });

        return { success: true, requiresConfirmation: false };
      },

      confirmAndReplaceCart: (newItem, quantity = 1) => {
        const instanceKey = newItem.cartItemId || generateCartKey(newItem);
        const nextDeliveryFee = newItem.vendorDeliveryFee !== undefined ? newItem.vendorDeliveryFee : 500;
        const nextEstimatedDelivery = newItem.vendorEstimatedDelivery || "20-35 mins";

        set({
          items: [{ ...newItem, cartItemId: instanceKey, quantity: quantity > 0 ? quantity : 1 }],
          vendorId: newItem.vendorId,
          vendorName: newItem.vendorName,
          vendorDeliveryFee: nextDeliveryFee,
          vendorEstimatedDelivery: nextEstimatedDelivery,
        });
      },

      setVendorDeliveryDetails: (deliveryFee: number, estimatedDelivery?: string) => {
        set({
          vendorDeliveryFee: typeof deliveryFee === "number" ? deliveryFee : 500,
          ...(estimatedDelivery ? { vendorEstimatedDelivery: estimatedDelivery } : {}),
        });
      },

      removeItem: (idOrCartItemId) => {
        set((state) => {
          if (!state.items || !Array.isArray(state.items)) {
            return {
              ...state,
              items: [],
              vendorId: null,
              vendorName: null,
              vendorDeliveryFee: 500,
              vendorEstimatedDelivery: "20-35 mins",
            };
          }
          const targetKey = String(idOrCartItemId || "");
          const newItems = state.items.filter((i) => {
            if (!i) return false;
            const itemKey = String(i.cartItemId || i.id || "");
            const itemId = String(i.id || "");
            return itemKey !== targetKey && itemId !== targetKey;
          });
          return {
            ...state,
            items: newItems,
            vendorId: newItems.length === 0 ? null : state.vendorId,
            vendorName: newItems.length === 0 ? null : state.vendorName,
            vendorDeliveryFee: newItems.length === 0 ? 500 : state.vendorDeliveryFee,
            vendorEstimatedDelivery: newItems.length === 0 ? "20-35 mins" : state.vendorEstimatedDelivery,
          };
        });
      },

      updateQuantity: (idOrCartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(idOrCartItemId);
          return;
        }
        set((state) => {
          if (!state.items || !Array.isArray(state.items)) return state;
          const targetKey = String(idOrCartItemId || "");
          return {
            ...state,
            items: state.items.map((i) => {
              if (!i) return i;
              const itemKey = String(i.cartItemId || i.id || "");
              return itemKey === targetKey || String(i.id) === targetKey
                ? { ...i, quantity: Number(quantity) || 1 }
                : i;
            }),
          };
        });
      },

      clearCart: () => {
        set({ items: [], vendorId: null, vendorName: null, vendorDeliveryFee: 500, vendorEstimatedDelivery: "20-35 mins" });
      },

      getTotal: () => {
        const items = get().items;
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((total, item) => {
          if (!item) return total;
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 1;
          return total + price * qty;
        }, 0);
      },

      getDeliveryFee: () => {
        const items = get().items;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return get().vendorDeliveryFee ?? 500;
        }
        const itemFees = items.map((i) => {
          if (!i) return get().vendorDeliveryFee ?? 500;
          if (i.itemDeliveryFee !== undefined && i.itemDeliveryFee !== null) {
            return Number(i.itemDeliveryFee);
          }
          if (i.vendorDeliveryFee !== undefined && i.vendorDeliveryFee !== null) {
            return Number(i.vendorDeliveryFee);
          }
          return get().vendorDeliveryFee ?? 500;
        });
        const validFees = itemFees.filter((f) => !isNaN(f) && typeof f === "number");
        return validFees.length > 0 ? Math.max(...validFees) : (get().vendorDeliveryFee ?? 500);
      },

      getEstimatedDelivery: () => {
        const items = get().items;
        if (!items || !Array.isArray(items) || items.length === 0) {
          return get().vendorEstimatedDelivery || "20-35 mins";
        }
        const dayItem = items.find((i) => {
          if (!i) return false;
          const t = String(i.itemEstimatedDelivery || i.vendorEstimatedDelivery || "").toLowerCase();
          return t.includes("day");
        });
        if (dayItem) {
          return dayItem.itemEstimatedDelivery || dayItem.vendorEstimatedDelivery || "1-2 days";
        }
        const first = items.find((i) => Boolean(i));
        return first?.itemEstimatedDelivery || first?.vendorEstimatedDelivery || get().vendorEstimatedDelivery || "20-35 mins";
      },

      getPlatformFee: () => {
        return 50;
      },

      getGrandTotal: () => {
        const subtotal = get().getTotal();
        const fee = get().getDeliveryFee();
        return subtotal + fee + 50;
      },

      getItemCount: () => {
        const items = get().items;
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((count, item) => {
          if (!item) return count;
          return count + (Number(item.quantity) || 1);
        }, 0);
      },
    }),
    {
      name: "campus-cart-storage",
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || !Array.isArray(persistedState.items)) {
          return {
            items: [],
            vendorId: null,
            vendorName: null,
            vendorDeliveryFee: 500,
            vendorEstimatedDelivery: "20-35 mins",
          };
        }
        return persistedState;
      },
    }
  )
);
