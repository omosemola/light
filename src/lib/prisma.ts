import { PrismaClient } from "@prisma/client";

function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);

    // If connecting via Supabase Transaction Pooler (port 6543) or Supabase pooler host
    if (url.port === "6543" || url.hostname.includes("pooler.supabase.com")) {
      url.searchParams.set("pgbouncer", "true");
    }

    // In serverless / Vercel / production environments, cap connection_limit to 1 to prevent Supavisor pool exhaustion
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      url.searchParams.set("connection_limit", "1");
      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "15");
      }
      if (!url.searchParams.has("connect_timeout")) {
        url.searchParams.set("connect_timeout", "15");
      }
    }

    return url.toString();
  } catch {
    // Robust fallback if credentials contain special characters that confuse the URL constructor
    let url = rawUrl;
    const isPooler = url.includes(":6543") || url.includes("pooler.supabase.com");
    const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");

    const appendParam = (key: string, val: string) => {
      if (!url.includes(`${key}=`)) {
        url += (url.includes("?") ? "&" : "?") + `${key}=${val}`;
      }
    };

    if (isPooler) {
      appendParam("pgbouncer", "true");
    }
    if (isProd) {
      appendParam("connection_limit", "1");
      appendParam("pool_timeout", "15");
      appendParam("connect_timeout", "15");
    }

    return url;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const optimizedUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: optimizedUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Persist singleton instance across warm serverless container invocations to prevent connection pool exhaustion
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  globalForPrisma.prisma = globalForPrisma.prisma || prisma;
}

