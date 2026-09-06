import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle FormData multipart/form-data upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folder = (formData.get("folder") as string) || "lightson_marketplace/products";

      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
      }

      // Check max size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "Image size exceeds 10MB limit" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await uploadToCloudinary(buffer, folder);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, url: result.url });
    }

    // 2. Handle JSON payload containing base64 string
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { image, folder = "lightson_marketplace/products" } = body;

      if (!image) {
        return NextResponse.json({ success: false, error: "No image payload provided" }, { status: 400 });
      }

      // If already a hosted URL (http/https), return as is without re-uploading
      if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))) {
        return NextResponse.json({ success: true, url: image });
      }

      const result = await uploadToCloudinary(image, folder);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, url: result.url });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported Content-Type. Use multipart/form-data or application/json" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API Upload Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
