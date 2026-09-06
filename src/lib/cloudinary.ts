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
        error: "Cloudinary credentials missing. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file." 
      };
    }

    const uploadOptions = {
      folder,
      resource_type: "image" as const,
      transformation: [
        { quality: "auto:eco", fetch_format: "auto", max_width: 1600, max_height: 1600, crop: "limit" },
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
    return { success: false, error: error.message || "Failed to upload image to Cloudinary" };
  }
}
