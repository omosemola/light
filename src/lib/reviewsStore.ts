import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProductReview {
  id: string;
  author: string;
  avatar: string;
  hostel: string;
  rating: number;
  date: string;
  comment: string;
  likes: number;
  isLiked?: boolean;
}

interface ReviewsState {
  reviewsByProduct: Record<string, ProductReview[]>;
  getReviewsForProduct: (productId: string) => ProductReview[];
  addProductReview: (productId: string, review: Omit<ProductReview, "id" | "date" | "likes">) => ProductReview;
  toggleLikeReview: (productId: string, reviewId: string) => void;
}

const DEFAULT_INITIAL_REVIEWS: Record<string, ProductReview[]> = {};

export const useReviewsStore = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviewsByProduct: DEFAULT_INITIAL_REVIEWS,

      getReviewsForProduct: (productId: string) => {
        const storeReviews = get().reviewsByProduct;
        return storeReviews[productId] || [];
      },

      addProductReview: (productId: string, reviewInput) => {
        const newReview: ProductReview = {
          ...reviewInput,
          id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: "Just now",
          likes: 0,
          isLiked: false,
        };

        set((state) => {
          const currentReviews = state.reviewsByProduct[productId] || [];
          return {
            reviewsByProduct: {
              ...state.reviewsByProduct,
              [productId]: [newReview, ...currentReviews],
            },
          };
        });

        return newReview;
      },

      toggleLikeReview: (productId: string, reviewId: string) => {
        set((state) => {
          const currentReviews = state.reviewsByProduct[productId] || [];
          const updated = currentReviews.map((r) => {
            if (r.id === reviewId) {
              const nextLiked = !r.isLiked;
              return {
                ...r,
                isLiked: nextLiked,
                likes: nextLiked ? r.likes + 1 : Math.max(0, r.likes - 1),
              };
            }
            return r;
          });

          return {
            reviewsByProduct: {
              ...state.reviewsByProduct,
              [productId]: updated,
            },
          };
        });
      },
    }),
    {
      name: "lightson-product-reviews-storage-v1",
    }
  )
);
