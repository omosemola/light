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

const DEFAULT_INITIAL_REVIEWS: Record<string, ProductReview[]> = {
  p1: [
    {
      id: "r1",
      author: "David O.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
      hostel: "Mellanby Hall",
      rating: 5,
      date: "2 hours ago",
      comment: "Portion size was huge! The chicken leg was properly grilled and the pepper sauce was spicy and authentic. Delivery took under 15 mins to Mellanby lodge.",
      likes: 14,
    },
    {
      id: "r2",
      author: "Blessing A.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      hostel: "Queen Elizabeth Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Mama Cass never disappoints. Hot Jollof rice right after a 3-hour GST lecture is pure bliss. Packaging was clean and leak-proof!",
      likes: 8,
    },
    {
      id: "r3",
      author: "Emmanuel K.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      hostel: "Tedder Hall",
      rating: 4,
      date: "3 days ago",
      comment: "Food came piping hot and well packaged. Plantains were sweet and perfectly fried. Will definitely reorder.",
      likes: 5,
    },
  ],
  p2: [
    {
      id: "r4",
      author: "Chidimma N.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      hostel: "Idia Hall",
      rating: 5,
      date: "Yesterday",
      comment: "Extremely refreshing juice! No sugar added, pure orange pulp. Great for hot afternoon lectures.",
      likes: 9,
    },
  ],
};

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
