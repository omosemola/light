"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  getUserFavorites, 
  toggleUserFavoriteProduct, 
  toggleUserFavoriteStore 
} from "@/actions/favorites";

export interface FavoriteProductItem {
  id: string;
  name: string;
  price: number;
  image: string;
  vendorName?: string;
  rating?: number;
  category?: string;
}

export interface FavoriteStoreItem {
  id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  rating?: number;
  estimatedDelivery?: string;
  isOpen?: boolean;
}

interface FavoritesState {
  favoriteProductIds: string[];
  favoriteStoreIds: string[];
  favoriteProducts: FavoriteProductItem[];
  favoriteStores: FavoriteStoreItem[];
  currentUserEmail: string | null;
  isLoading: boolean;

  // Actions
  isProductFavorite: (productId: string) => boolean;
  isStoreFavorite: (storeId: string) => boolean;
  toggleProductFavorite: (product: FavoriteProductItem, userEmail?: string) => Promise<boolean>;
  toggleStoreFavorite: (store: FavoriteStoreItem, userEmail?: string) => Promise<boolean>;
  syncWithUserAccount: (userEmail?: string) => Promise<void>;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteProductIds: [],
      favoriteStoreIds: [],
      favoriteProducts: [],
      favoriteStores: [],
      currentUserEmail: null,
      isLoading: false,

      isProductFavorite: (productId: string) => {
        return get().favoriteProductIds.includes(productId);
      },

      isStoreFavorite: (storeId: string) => {
        return get().favoriteStoreIds.includes(storeId);
      },

      toggleProductFavorite: async (product: FavoriteProductItem, userEmail?: string) => {
        const { favoriteProductIds, favoriteProducts } = get();
        const isFav = favoriteProductIds.includes(product.id);

        let newIds: string[];
        let newProducts: FavoriteProductItem[];

        if (isFav) {
          newIds = favoriteProductIds.filter((id) => id !== product.id);
          newProducts = favoriteProducts.filter((p) => p.id !== product.id);
        } else {
          newIds = [...favoriteProductIds, product.id];
          newProducts = [product, ...favoriteProducts.filter((p) => p.id !== product.id)];
        }

        set({
          favoriteProductIds: newIds,
          favoriteProducts: newProducts,
        });

        // Sync to server if email provided
        if (userEmail && userEmail.trim()) {
          try {
            await toggleUserFavoriteProduct(userEmail, product.id);
          } catch (e) {
            console.error("Failed to sync product favorite to DB:", e);
          }
        }

        return !isFav;
      },

      toggleStoreFavorite: async (store: FavoriteStoreItem, userEmail?: string) => {
        const { favoriteStoreIds, favoriteStores } = get();
        const isFav = favoriteStoreIds.includes(store.id);

        let newIds: string[];
        let newStores: FavoriteStoreItem[];

        if (isFav) {
          newIds = favoriteStoreIds.filter((id) => id !== store.id);
          newStores = favoriteStores.filter((s) => s.id !== store.id);
        } else {
          newIds = [...favoriteStoreIds, store.id];
          newStores = [store, ...favoriteStores.filter((s) => s.id !== store.id)];
        }

        set({
          favoriteStoreIds: newIds,
          favoriteStores: newStores,
        });

        // Sync to server if email provided
        if (userEmail && userEmail.trim()) {
          try {
            await toggleUserFavoriteStore(userEmail, store.id);
          } catch (e) {
            console.error("Failed to sync store favorite to DB:", e);
          }
        }

        return !isFav;
      },

      syncWithUserAccount: async (userEmail?: string) => {
        if (!userEmail || !userEmail.trim()) return;

        set({ isLoading: true, currentUserEmail: userEmail });

        try {
          const res = await getUserFavorites(userEmail);
          if (res.success) {
            const formattedProducts: FavoriteProductItem[] = (res.favoriteProducts || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
              vendorName: p.store?.name,
              rating: 4.8,
              category: p.category?.name,
            }));

            const formattedStores: FavoriteStoreItem[] = (res.favoriteStores || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              logo: s.logo,
              coverImage: s.coverImage,
              rating: s.rating || 5.0,
              estimatedDelivery: s.estimatedDelivery,
              isOpen: s.isOpen,
            }));

            set({
              favoriteProductIds: res.favoriteProductIds || [],
              favoriteStoreIds: res.favoriteStoreIds || [],
              favoriteProducts: formattedProducts,
              favoriteStores: formattedStores,
              isLoading: false,
            });
          }
        } catch (err) {
          console.error("Error syncing favorites from account:", err);
          set({ isLoading: false });
        }
      },

      clearFavorites: () => {
        set({
          favoriteProductIds: [],
          favoriteStoreIds: [],
          favoriteProducts: [],
          favoriteStores: [],
          currentUserEmail: null,
        });
      },
    }),
    {
      name: "campus_favorites_storage",
    }
  )
);
