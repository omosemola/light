/**
 * Client-side helper for uploading image files to Cloudinary via /api/upload.
 * Drops image sizes from multi-megabyte base64 strings down to clean HTTPS CDN URLs.
 */
export async function uploadImageToCloud(
  fileOrBase64: File | string,
  folder: string = "lightson_marketplace/products"
): Promise<string> {
  // If already an HTTP/HTTPS URL, no need to upload
  if (typeof fileOrBase64 === "string" && (fileOrBase64.startsWith("http://") || fileOrBase64.startsWith("https://"))) {
    return fileOrBase64;
  }

  try {
    if (fileOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append("file", fileOrBase64);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        console.warn("[Upload] Server upload returned non-OK or fallback:", data?.error);
        throw new Error(data?.error || "Failed to upload to image server");
      }
      return data.url;
    } else if (typeof fileOrBase64 === "string") {
      // Base64 string upload
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: fileOrBase64, folder }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        console.warn("[Upload] Base64 upload returned non-OK or fallback:", data?.error);
        throw new Error(data?.error || "Failed to upload to image server");
      }
      return data.url;
    }

    throw new Error("Invalid file format provided for upload");
  } catch (err: any) {
    console.error("[uploadImageToCloud Error]:", err);
    // If Cloudinary keys are missing in dev mode, rethrow or allow caller to handle
    throw err;
  }
}
