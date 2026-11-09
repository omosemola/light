const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database and fetching products...");
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${products.length} products.`);

  const backupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `products-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, filename);

  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), "utf-8");
  console.log(`Successfully backed up ${products.length} products to: ${backupPath}`);

  // Image analysis
  let base64Count = 0;
  let cloudinaryCount = 0;
  let otherCount = 0;

  for (const p of products) {
    const img = p.image || "";
    if (img.includes("data:image/")) {
      base64Count++;
    } else if (img.includes("cloudinary.com")) {
      cloudinaryCount++;
    } else {
      otherCount++;
    }
  }

  console.log("Image breakdown in database:");
  console.log(` - Products containing base64 images: ${base64Count}`);
  console.log(` - Products containing Cloudinary images: ${cloudinaryCount}`);
  console.log(` - Products with other URLs: ${otherCount}`);
}

main()
  .catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

