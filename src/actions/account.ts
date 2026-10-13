"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rateLimit";
import { notifyAdminNewStudent } from "@/lib/email";
export interface SavedLocationItem {
  id: string;
  title: string;
  address: string;
  isDefault: boolean;
}

export async function getUserProfileDb(email: string) {
  try {
    if (!email || !email.trim()) return { success: false, user: null };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      include: {
        store: { select: { id: true, name: true } },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return { success: true, user: null };
    }

    const parsedLocations: SavedLocationItem[] = (user.savedLocations || []).map((locStr) => {
      try {
        return typeof locStr === "string" && locStr.startsWith("{") ? JSON.parse(locStr) : { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      } catch {
        return { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      }
    });

    const ordersCount = user._count?.orders ?? 0;
    const reviewsCount = user._count?.reviews ?? 0;
    const points = ordersCount * 50;

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || cleanEmail,
        phone: user.phone || "",
        image: user.image || "",
        role: user.role || "STUDENT",
        hostel: user.hostel || "",
        addressDetail: user.addressDetail || "",
        savedLocations: parsedLocations,
        storeId: user.store?.id,
        storeName: user.store?.name,
        favoriteProductIds: user.favoriteProductIds || [],
        favoriteStoreIds: user.favoriteStoreIds || [],
        ordersCount,
        reviewsCount,
        points,
      },
    };
  } catch (error: any) {
    console.error("Error retrieving user profile from DB:", error);
    return { success: false, error: error.message, user: null };
  }
}

export async function updateUserProfileDb(
  email: string,
  data: {
    name?: string;
    phone?: string;
    image?: string;
    password?: string;
    hostel?: string;
    addressDetail?: string;
    savedLocations?: SavedLocationItem[];
  }
) {
  try {
    if (!email || !email.trim()) return { success: false, error: "User email is required" };
    
    // Add bot protection / rate limiting for profile updates and signups
    const rateLimitKey = `profile_update_${email.trim().toLowerCase()}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);
    if (!rateLimit.success) return { success: false, error: rateLimit.error };

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    let finalImageUrl = data.image;
    if (data.image && data.image.startsWith("data:image/")) {
      const uploadRes = await uploadToCloudinary(data.image, "lightson_marketplace/avatars");
      if (uploadRes.success && uploadRes.url) {
        finalImageUrl = uploadRes.url;
      }
    }

    const stringifiedLocations = data.savedLocations
      ? data.savedLocations.map((loc) => JSON.stringify(loc))
      : undefined;

    if (!user) {
      const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: data.name || cleanEmail.split("@")[0],
          phone: data.phone || null,
          image: finalImageUrl || null,
          password: hashedPassword,
          hostel: data.hostel || null,
          addressDetail: data.addressDetail || null,
          savedLocations: stringifiedLocations || [],
          role: "STUDENT",
        },
      });

      // Notify Admin via email of new student registration
      notifyAdminNewStudent({
        name: user.name || "Student",
        email: user.email,
        phone: user.phone || data.phone || null,
        hostel: user.hostel || data.hostel || null,
        addressDetail: user.addressDetail || data.addressDetail || null,
        source: "Registration Form",
      }).catch((e) => console.error("Admin student registration notification error:", e));
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name !== undefined ? data.name : user.name,
          phone: data.phone !== undefined ? data.phone : user.phone,
          image: finalImageUrl !== undefined ? finalImageUrl : user.image,
          hostel: data.hostel !== undefined ? data.hostel : user.hostel,
          addressDetail: data.addressDetail !== undefined ? data.addressDetail : user.addressDetail,
          ...(stringifiedLocations !== undefined ? { savedLocations: stringifiedLocations } : {}),
        },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/profile/settings");
    revalidatePath("/profile/locations");
    revalidatePath("/");

    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating user profile in DB:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}

export async function getUserLocationsDb(email: string) {
  try {
    if (!email || !email.trim()) return { success: false, locations: [] };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      select: { savedLocations: true, hostel: true, addressDetail: true },
    });

    if (!user) return { success: true, locations: [] };

    const locations: SavedLocationItem[] = (user.savedLocations || []).map((locStr) => {
      try {
        return typeof locStr === "string" && locStr.startsWith("{")
          ? JSON.parse(locStr)
          : { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      } catch {
        return { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      }
    });

    if (locations.length === 0 && user.hostel && user.hostel.trim().length > 0) {
      locations.push({
        id: "default_primary_loc",
        title: user.hostel.trim(),
        address: (user.addressDetail || user.hostel).trim(),
        isDefault: true,
      });
    }

    return { success: true, locations };
  } catch (error: any) {
    console.error("Error fetching user locations from DB:", error);
    return { success: false, error: error.message, locations: [] };
  }
}

export async function saveUserLocationDb(
  email: string,
  location: { id?: string; title: string; address: string; isDefault?: boolean }
) {
  try {
    if (!email || !email.trim()) return { success: false, error: "User email required" };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) return { success: false, error: "User not found" };

    let currentList: SavedLocationItem[] = (user.savedLocations || []).map((locStr) => {
      try {
        return JSON.parse(locStr);
      } catch {
        return { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      }
    });

    const isFirstLocation = currentList.length === 0;
    const makeDefault = location.isDefault ?? isFirstLocation;

    if (makeDefault) {
      currentList = currentList.map((loc) => ({ ...loc, isDefault: false }));
    }

    const locId = location.id || `loc_${Date.now()}`;
    const existingIndex = currentList.findIndex((l) => l.id === locId);

    const newLoc: SavedLocationItem = {
      id: locId,
      title: location.title.trim(),
      address: location.address.trim(),
      isDefault: makeDefault,
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = newLoc;
    } else {
      currentList.push(newLoc);
    }

    const serialized = currentList.map((l) => JSON.stringify(l));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        savedLocations: serialized,
        ...(makeDefault
          ? {
              hostel: newLoc.title,
              addressDetail: newLoc.address,
            }
          : {}),
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/locations");

    return { success: true, locations: currentList, defaultLocation: makeDefault ? newLoc : null };
  } catch (error: any) {
    console.error("Error saving user location in DB:", error);
    return { success: false, error: error.message || "Failed to save location" };
  }
}

export async function deleteUserLocationDb(email: string, locationId: string) {
  try {
    if (!email || !email.trim()) return { success: false, error: "User email required" };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) return { success: false, error: "User not found" };

    let currentList: SavedLocationItem[] = (user.savedLocations || []).map((locStr) => {
      try {
        return JSON.parse(locStr);
      } catch {
        return { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      }
    });

    currentList = currentList.filter((loc) => loc.id !== locationId);

    // If deleted location was default and remaining locations exist, make first remaining default
    if (currentList.length > 0 && !currentList.some((l) => l.isDefault)) {
      currentList[0].isDefault = true;
    }

    const defaultLoc = currentList.find((l) => l.isDefault) || null;
    const serialized = currentList.map((l) => JSON.stringify(l));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        savedLocations: serialized,
        hostel: defaultLoc ? defaultLoc.title : "",
        addressDetail: defaultLoc ? defaultLoc.address : "",
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/locations");

    return { success: true, locations: currentList };
  } catch (error: any) {
    console.error("Error deleting user location in DB:", error);
    return { success: false, error: error.message || "Failed to delete location" };
  }
}

export async function setDefaultLocationDb(email: string, locationId: string) {
  try {
    if (!email || !email.trim()) return { success: false, error: "User email required" };

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) return { success: false, error: "User not found" };

    let currentList: SavedLocationItem[] = (user.savedLocations || []).map((locStr) => {
      try {
        return JSON.parse(locStr);
      } catch {
        return { id: String(Date.now()), title: "Hostel", address: locStr, isDefault: false };
      }
    });

    let targetLoc: SavedLocationItem | null = null;
    currentList = currentList.map((loc) => {
      if (loc.id === locationId) {
        targetLoc = { ...loc, isDefault: true };
        return targetLoc;
      }
      return { ...loc, isDefault: false };
    });

    if (!targetLoc) return { success: false, error: "Location not found" };

    const serialized = currentList.map((l) => JSON.stringify(l));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        savedLocations: serialized,
        hostel: (targetLoc as SavedLocationItem).title,
        addressDetail: (targetLoc as SavedLocationItem).address,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile/locations");

    return { success: true, locations: currentList, defaultLocation: targetLoc };
  } catch (error: any) {
    console.error("Error setting default location in DB:", error);
    return { success: false, error: error.message || "Failed to set default location" };
  }
}

export async function changeUserPasswordDb(email: string, currentPass: string, newPass: string) {
  try {
    if (!email) return { success: false, error: "User email is required" };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    // If user has existing password, verify current password
    if (user.password) {
      const isValid = await bcrypt.compare(currentPass, user.password);
      if (!isValid) {
        return { success: false, error: "Current password is incorrect" };
      }
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error: any) {
    console.error("Error changing password in DB:", error);
    return { success: false, error: error.message || "Failed to change password" };
  }
}

export async function deleteUserAccountSelf(email: string) {
  try {
    if (!email) return { success: false, error: "User email is required" };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User account not found" };
    }

    // Delete related orders and user
    await prisma.user.delete({
      where: { id: user.id },
    });

    revalidatePath("/");
    return { success: true, message: "Account successfully deleted" };
  } catch (error: any) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message || "Failed to delete account" };
  }
}
