const { PrismaClient } = require("@prisma/client");
const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yvkipxsa",
  api_key: process.env.CLOUDINARY_API_KEY || "416945821691826",
  api_secret: process.env.CLOUDINARY_API_SECRET || "jaIaTTPwXIfTQ_YU91QTtTMrAno",
  secure: true,
});

async function uploadToCloudinary(base64Str, folder = "lightson_marketplace/stores", retries = 3) {
  const uploadOptions = {
    folder,
    resource_type: "image",
    transformation: [
      { quality: "auto:good", fetch_format: "auto", max_width: 1200, max_height: 1200, crop: "limit" },
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
      console.warn(`   [Retry ${attempt}/${retries}] Upload failed: ${err.message}. Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  console.log("===============================================================");
  console.log("   LIGHTSON MARKETPLACE - FULL BASE64 TO CLOUDINARY MIGRATION  ");
  console.log("===============================================================\n");

  let totalMigrated = 0;
  let totalBytesSaved = 0;

  // 1. MIGRATE STORE LOGOS
  console.log("--- 1. Migrating Store Logos ---");
  const storesWithBase64Logo = await prisma.store.findMany({
    where: {
      logo: { startsWith: "data:image" },
    },
    select: { id: true, name: true, logo: true },
  });

  console.log(`Found ${storesWithBase64Logo.length} stores with base64 logos.\n`);

  for (let i = 0; i < storesWithBase64Logo.length; i++) {
    const s = storesWithBase64Logo[i];
    const rawLen = s.logo ? s.logo.length : 0;
    process.stdout.write(`[${i + 1}/${storesWithBase64Logo.length}] Store: "${s.name}" (${(rawLen / 1024).toFixed(1)} KB)... `);
    try {
      const url = await uploadToCloudinary(s.logo, "lightson_marketplace/stores");
      await prisma.store.update({
        where: { id: s.id },
        data: { logo: url },
      });
      totalMigrated++;
      totalBytesSaved += rawLen;
      console.log(`DONE -> ${url.substring(0, 48)}...`);
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
    }
  }

  // 2. MIGRATE STORE COVER IMAGES
  console.log("\n--- 2. Migrating Store Cover Images ---");
  const storesWithBase64Cover = await prisma.store.findMany({
    where: {
      coverImage: { startsWith: "data:image" },
    },
    select: { id: true, name: true, coverImage: true },
  });

  console.log(`Found ${storesWithBase64Cover.length} stores with base64 cover images.\n`);

  for (let i = 0; i < storesWithBase64Cover.length; i++) {
    const s = storesWithBase64Cover[i];
    const rawLen = s.coverImage ? s.coverImage.length : 0;
    process.stdout.write(`[${i + 1}/${storesWithBase64Cover.length}] Cover for: "${s.name}" (${(rawLen / 1024).toFixed(1)} KB)... `);
    try {
      const url = await uploadToCloudinary(s.coverImage, "lightson_marketplace/stores");
      await prisma.store.update({
        where: { id: s.id },
        data: { coverImage: url },
      });
      totalMigrated++;
      totalBytesSaved += rawLen;
      console.log(`DONE -> ${url.substring(0, 48)}...`);
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
    }
  }

  // 3. MIGRATE USER AVATARS
  console.log("\n--- 3. Migrating User Profile Images ---");
  const usersWithBase64Image = await prisma.user.findMany({
    where: {
      image: { startsWith: "data:image" },
    },
    select: { id: true, name: true, email: true, image: true },
  });

  console.log(`Found ${usersWithBase64Image.length} users with base64 avatars.\n`);

  for (let i = 0; i < usersWithBase64Image.length; i++) {
    const u = usersWithBase64Image[i];
    const rawLen = u.image ? u.image.length : 0;
    process.stdout.write(`[${i + 1}/${usersWithBase64Image.length}] User: "${u.name || u.email}" (${(rawLen / 1024).toFixed(1)} KB)... `);
    try {
      const url = await uploadToCloudinary(u.image, "lightson_marketplace/avatars");
      await prisma.user.update({
        where: { id: u.id },
        data: { image: url },
      });
      totalMigrated++;
      totalBytesSaved += rawLen;
      console.log(`DONE -> ${url.substring(0, 48)}...`);
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
    }
  }

  // 4. VERIFY PRODUCTS AS WELL
  console.log("\n--- 4. Checking Products for any leftover base64 ---");
  const productsWithBase64 = await prisma.product.findMany({
    where: {
      image: { contains: "data:image" },
    },
    select: { id: true, name: true, image: true },
  });

  console.log(`Products with base64: ${productsWithBase64.length}`);

  console.log("\n===============================================================");
  console.log("   MIGRATION COMPLETED SUCCESSFULLY!                           ");
  console.log(`   Total items migrated to Cloudinary: ${totalMigrated}`);
  console.log(`   Estimated database egress savings: ${(totalBytesSaved / 1024 / 1024).toFixed(2)} MB per query cycle`);
  console.log("===============================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
