import { z } from "zod";

const DUMMY_PHONE_PATTERNS = [
  "8012345678",
  "8123459900",
  "1234567890",
  "0000000000",
];

export function isDummyPhoneNumber(phone?: string | null): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return false;
  return DUMMY_PHONE_PATTERNS.some((pattern) => digits.endsWith(pattern));
}

export function sanitizePhoneNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== "string") return null;
  const trimmed = phone.trim();
  if (!trimmed || isDummyPhoneNumber(trimmed)) return null;
  return trimmed;
}

export const vendorStoreRegistrationSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(50, "Store name is too long"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15)
    .refine((val) => !isDummyPhoneNumber(val), "Please enter your real active phone number, not a placeholder example."),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  location: z.string().min(2, "Location is required"),
  description: z.string().max(500).optional(),
  coverImage: z.string().optional(),
  logoUrl: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  paystackSubaccountCode: z.string().optional(),
});

export const productCreationSchema = z.object({
  storeId: z.string().min(5),
  name: z.string().min(2, "Product name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().positive("Price must be a positive number"),
  image: z.string().min(5, "Product image is required"),
  categoryId: z.string().optional().nullable(),
  estimatedDelivery: z.string().max(50).optional().nullable(),
  deliveryFee: z.coerce.number().nonnegative("Delivery fee cannot be negative").optional().nullable(),
});

export const productUpdateSchema = productCreationSchema.extend({
  productId: z.string().min(5, "Product ID is required"),
  isAvailable: z.boolean().optional(),
}).partial({
  name: true,
  price: true,
  image: true,
  storeId: true,
});

export const storeScheduleSchema = z.object({
  storeId: z.string().min(5, "Store ID is required"),
  openingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid opening time format (HH:MM)"),
  closingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid closing time format (HH:MM)"),
  phone: z
    .string()
    .min(10)
    .max(15)
    .refine((val) => !isDummyPhoneNumber(val), "Please enter a real active phone number.")
    .optional(),
  estimatedDelivery: z.string().max(50).optional(),
  deliveryFee: z.coerce.number().nonnegative().optional(),
  isOpen: z.boolean().optional(),
});

export const userProfileSchema = z.object({
  name: z.string().optional(),
  phone: z
    .string()
    .refine((val) => !val || !isDummyPhoneNumber(val), "Please enter a real active phone number.")
    .optional(),
  image: z.string().optional(),
  password: z.string().optional(),
  hostel: z.string().optional(),
  addressDetail: z.string().optional()
});