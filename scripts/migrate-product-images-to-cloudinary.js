const { PrismaClient } = require("@prisma/client");
const { v2: cloudinary } = require("cloudinary");

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

function parseProductImages(imageField) {
  if (!imageField) return [DEFAULT_FALLBACK_IMAGE];
  if (typeof imageField !== "string") {
    if (Array.isArray(imageField) && imageField.length > 0) {
      const valid = imageField.map((img) => String(img || "").trim()).filter(Boolean);
      return valid.length > 0 ? valid : [DEFAULT_FALLBACK_IMAGE];
    }
    return [DEFAULT_FALLBACK_IMAGE];
  }
  const trimmed = imageField.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
        if (valid.length > 0) return valid;
      }
    } catch {
      // Fallback
    }
  }
  if (!trimmed || trimmed === "[]" || trimmed === "null" || trimmed === "undefined") {
    return [DEFAULT_FALLBACK_IMAGE];
  }
  return [trimmed];
}

function encodeProductImages(images) {
  const cleanImages = images.filter((img) => img && img.trim().length > 0);
  if (cleanImages.length === 0) return DEFAULT_FALLBACK_IMAGE;
  if (cleanImages.length === 1) return cleanImages[0];
  return JSON.stringify(cleanImages);
}

async function uploadSingleImageToCloudinary(base64Str, retries = 3) {
  const uploadOptions = {
    folder: "lightson_marketplace/products",
    resource_type: "image",
    transformation: [
      { quality: "auto:good", fetch_format: "auto", max_width: 1600, max_height: 1600, crop: "limit" },
    ],
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(base64Str, uploadOptions);
      if (result && (result.secure_url || result.url)) {
        return result.secure_url || result.url;
      }
      throw new Error("No URL returned from Cloudinary");
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Retry ${attempt}/${retries}] Upload failed: ${err.message}. Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  console.log("=================================================");
  console.log("   LIGHTSON MARKETPLACE CLOUDINARY MIGRATION     ");
  console.log("=================================================");
  console.log("Fetching all products from Supabase database...");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${products.length} total products in database.`);

  const productsWithBase64 = products.filter((p) => p.image && p.image.includes("data:image/"));
  console.log(`Products requiring migration (Base64 images): ${productsWithBase64.length}`);

  if (productsWithBase64.length === 0) {
    console.log("All product images are already on Cloudinary or external CDN. No migration needed!");
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  let totalUploadedImages = 0;

  for (let i = 0; i < productsWithBase64.length; i++) {
    const product = productsWithBase64[i];
    const indexStr = `[${i + 1}/${productsWithBase64.length}]`;
    console.log(`\n${indexStr} Processing product: "${product.name}" (ID: ${product.id})`);

    const images = parseProductImages(product.image);
    console.log(`   Found ${images.length} image(s) attached.`);

    const newImageUrls = [];
    let productFailed = false;

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const img = images[imgIdx];
      if (typeof img === "string" && img.startsWith("data:image/")) {
        try {
          process.stdout.write(`   Uploading image ${imgIdx + 1}/${images.length} to Cloudinary... `);
          const uploadedUrl = await uploadSingleImageToCloudinary(img);
          newImageUrls.push(uploadedUrl);
          totalUploadedImages++;
          console.log(`DONE -> ${uploadedUrl.substring(0, 50)}...`);
        } catch (uploadErr) {
          console.error(`FAILED: ${uploadErr.message}`);
          productFailed = true;
          break;
        }
      } else {
        newImageUrls.push(img);
      }
    }

    if (productFailed) {
      console.error(`   ❌ Skipped updating product "${product.name}" due to upload error.`);
      failureCount++;
      continue;
    }

    const updatedImageField = encodeProductImages(newImageUrls);

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { image: updatedImageField },
      });
      console.log(`   ✅ Successfully updated product record in database with Cloudinary URL(s).`);
      successCount++;
    } catch (dbErr) {
      console.error(`   ❌ Failed to update product in database: ${dbErr.message}`);
      failureCount++;
    }
  }

  console.log("\n=================================================");
  console.log("            MIGRATION RUN COMPLETED              ");
  console.log("=================================================");
  console.log(`Successfully migrated products: ${successCount}`);
  console.log(`Failed products:                ${failureCount}`);
  console.log(`Total images uploaded to CDN:   ${totalUploadedImages}`);

  // Final verification check
  const remainingBase64 = await prisma.product.count({
    where: { image: { contains: "data:image/" } },
  });
  const totalCloudinary = await prisma.product.count({
    where: { image: { contains: "res.cloudinary.com" } },
  });

  console.log(`\nVerification check in database:`);
  console.log(` - Products remaining with Base64: ${remainingBase64}`);
  console.log(` - Products now with Cloudinary:   ${totalCloudinary}`);
}

main()
  .catch((err) => {
    console.error("Migration fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

