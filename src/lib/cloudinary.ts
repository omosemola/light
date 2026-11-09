import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Uploads a base64 string or file buffer directly to Cloudinary CDN.
 * Automatically applies compression and format conversion (WebP/AVIF).
 */
export async function uploadToCloudinary(
  fileBufferOrBase64: string | Buffer,
  folder: string = "lightson_marketplace"
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("[Cloudinary] Credentials not configured in .env");
      return { 
        success: false, 
        error: "Cloudinary credentials missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file." 
      };
    }

    const uploadOptions = {
      folder,
      resource_type: "image" as const,
      transformation: [
        { quality: "auto:good", fetch_format: "auto", max_width: 1600, max_height: 1600, crop: "limit" },
      ],
    };

    if (typeof fileBufferOrBase64 === "string") {
      const result = await cloudinary.uploader.upload(fileBufferOrBase64, uploadOptions);
      return {
        success: true,
        url: result.secure_url || result.url,
      };
    } else {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        });
        stream.end(fileBufferOrBase64);
      });
      return {
        success: true,
        url: result.secure_url || result.url,
      };
    }
  } catch (error: any) {
    console.error("[Cloudinary Upload Error]:", error);
    const msg = error?.message || (typeof error === "string" ? error : "Failed to upload image to Cloudinary");
    return { success: false, error: msg };
  }
}

/**
 * Formats a Cloudinary URL to request optimized, transformed images directly from the CDN edge.
 * Injects automatic format negotiation (AVIF/WebP) and quality adjustments.
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:good" | "auto:eco" | "auto:best" | number;
    crop?: "fill" | "limit" | "fit" | "scale" | "thumb";
    format?: "auto" | "webp" | "avif" | "jpg";
  }
): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  const transformations: string[] = [];
  const format = options?.format || "auto";
  const quality = options?.quality || "auto:good";
  transformations.push(`f_${format}`);
  transformations.push(`q_${quality}`);

  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  else if (options?.width || options?.height) transformations.push("c_limit");

  const transformString = transformations.join(",");
  const afterUpload = parts[1];

  // If already contains a transformation segment right before the version or folder, replace or append
  if (afterUpload.startsWith("v") || afterUpload.startsWith("lightson_marketplace")) {
    return `${parts[0]}/upload/${transformString}/${afterUpload}`;
  }

  return `${parts[0]}/upload/${transformString}/${afterUpload}`;
}
