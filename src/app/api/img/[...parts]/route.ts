import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseProductImages } from "@/lib/productOptions";

export const runtime = "nodejs";

const IMMUTABLE = "public, max-age=31536000, immutable";

function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Serves images that are stored as base64 `data:` URIs in the database as real binary
 * responses. URL shape: /api/img/<kind>/<id>/<index>/<version>
 * The trailing <version> (the record's updatedAt) makes every URL immutable: when an image
 * changes, lists emit a new URL, so long-lived browser / CDN caching can never serve stale art.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ parts: string[] }> }) {
  try {
    const { parts } = await ctx.params;
    const [kind, id, idxRaw] = parts || [];
    if (!kind || !id) return notFound();
    const index = Math.max(0, parseInt(idxRaw || "0", 10) || 0);

    let value: string | null | undefined;
    if (kind === "product") {
      const row = await prisma.product.findUnique({ where: { id }, select: { image: true } });
      value = row ? parseProductImages(row.image)[index] : null;
    } else if (kind === "logo") {
      value = (await prisma.store.findUnique({ where: { id }, select: { logo: true } }))?.logo;
    } else if (kind === "cover") {
      value = (await prisma.store.findUnique({ where: { id }, select: { coverImage: true } }))?.coverImage;
    } else if (kind === "avatar") {
      value = (await prisma.user.findUnique({ where: { id }, select: { image: true } }))?.image;
    } else {
      return notFound();
    }

    if (!value) return notFound();

    // Regular hosted URLs: just redirect (short cache, they are rarely hit through this route).
    if (!value.startsWith("data:")) {
      if (/^https?:\/\//i.test(value)) {
        return NextResponse.redirect(value, { status: 307, headers: { "Cache-Control": "public, max-age=300" } });
      }
      return notFound();
    }

    const match = value.match(/^data:([^;,]+)?((?:;[^;,]+)*?),([\s\S]*)$/);
    if (!match) return notFound();

    const contentType = (match[1] || "image/jpeg").toLowerCase();
    if (!contentType.startsWith("image/")) return notFound();

    const isBase64 = /;base64/i.test(match[2] || "");
    const body = isBase64
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8");

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.length),
        "Cache-Control": IMMUTABLE,
        "X-Content-Type-Options": "nosniff",
        // Prevent any embedded script in SVG uploads from executing.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    console.error("Image route error:", error);
    return new NextResponse("Error", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
