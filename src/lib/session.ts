import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_SECRET = 
  process.env.SESSION_SECRET || 
  process.env.NEXTAUTH_SECRET || 
  "lightson-marketplace-secret-salt-prod-2026";

export const ADMIN_COOKIE_NAME = "lightson_admin_session";
export const VENDOR_SESSION_COOKIE = "lightson_vendor_session";
export const VENDOR_STORE_COOKIE = "lightson_vendor_store_id";

interface AdminPayload {
  role: "ADMIN";
  email: string;
  userId: string;
  exp: number;
}

interface VendorPayload {
  role: "VENDOR";
  userId: string;
  storeId: string;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function verifySignature(data: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac("sha256", secret).update(data).digest();
    const provided = Buffer.from(signature, "base64url");
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/**
 * Creates a signed token: payloadBase64.signatureBase64
 */
export function createSignedToken<T extends object>(payload: T, expiresInMs: number): string {
  const fullPayload = {
    ...payload,
    exp: Date.now() + expiresInMs,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(encodedPayload, SESSION_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed token with timingSafeEqual and expiration check
 */
export function verifySignedToken<T extends { exp: number }>(token: string | undefined | null): T | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  if (!verifySignature(encodedPayload, signature, SESSION_SECRET)) {
    return null;
  }

  try {
    const decodedStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(decodedStr) as T;
    if (!payload || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/* ──────────────────────── ADMIN SESSIONS ──────────────────────── */

export function createAdminToken(email: string, userId: string): string {
  return createSignedToken<Omit<AdminPayload, "exp">>(
    {
      role: "ADMIN",
      email: email.trim().toLowerCase(),
      userId,
    },
    7 * 24 * 60 * 60 * 1000 // 7 days
  );
}

export function verifyAdminToken(token: string | undefined | null): AdminPayload | null {
  const payload = verifySignedToken<AdminPayload>(token);
  if (!payload || payload.role !== "ADMIN" || !payload.email) {
    return null;
  }
  return payload;
}

export async function getAdminSession(): Promise<{
  isAuthenticated: boolean;
  email?: string;
  userId?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const payload = verifyAdminToken(token);
    if (!payload) return { isAuthenticated: false };

    return {
      isAuthenticated: true,
      email: payload.email,
      userId: payload.userId,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

export async function setAdminSessionCookie(email: string, userId: string) {
  const cookieStore = await cookies();
  const token = createAdminToken(email, userId);
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "strict",
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/* ──────────────────────── VENDOR SESSIONS ──────────────────────── */

export function createVendorToken(userId: string, storeId: string): string {
  return createSignedToken<Omit<VendorPayload, "exp">>(
    {
      role: "VENDOR",
      userId,
      storeId,
    },
    30 * 24 * 60 * 60 * 1000 // 30 days
  );
}

export function verifyVendorToken(token: string | undefined | null): VendorPayload | null {
  const payload = verifySignedToken<VendorPayload>(token);
  if (!payload || payload.role !== "VENDOR" || !payload.userId || !payload.storeId) {
    return null;
  }
  return payload;
}

export async function getVendorSession(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  storeId?: string;
}> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(VENDOR_SESSION_COOKIE)?.value;
    const storeCookie = cookieStore.get(VENDOR_STORE_COOKIE)?.value;

    // 1. Try verifying signed session token
    const payload = verifyVendorToken(sessionCookie);
    if (payload) {
      return {
        isAuthenticated: true,
        userId: payload.userId,
        storeId: payload.storeId,
      };
    }

    // 2. Fallback / Transition: If cookie holds legacy raw userId & storeId, verify directly in DB that store belongs to this user
    if (sessionCookie && storeCookie) {
      const verifiedStore = await prisma.store.findFirst({
        where: {
          id: storeCookie,
          userId: sessionCookie,
        },
        select: { id: true, userId: true },
      });

      if (verifiedStore) {
        // Upgrade cookie to signed token automatically!
        await setVendorSessionCookie(verifiedStore.userId, verifiedStore.id);
        return {
          isAuthenticated: true,
          userId: verifiedStore.userId,
          storeId: verifiedStore.id,
        };
      }
    }

    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

export async function setVendorSessionCookie(userId: string, storeId: string) {
  const cookieStore = await cookies();
  const token = createVendorToken(userId, storeId);
  cookieStore.set(VENDOR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "strict",
  });
  // Keep storeId in secondary cookie for convenience/client reads, but actions always verify the signed token
  cookieStore.set(VENDOR_STORE_COOKIE, storeId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "strict",
  });
}

export async function clearVendorSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(VENDOR_SESSION_COOKIE);
  cookieStore.delete(VENDOR_STORE_COOKIE);
}

