const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("   LIGHTSON PLATFORM - FULL DATABASE BACKUP");
  console.log("==========================================");
  console.log("Connecting to Supabase PostgreSQL database...\n");

  const startTime = Date.now();

  const [
    users,
    stores,
    categories,
    products,
    orders,
    orderItems,
    supportTickets,
    reviews,
    notifications,
    chatMessages,
    passwordResetTokens,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.store.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.orderItem.findMany(),
    prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.chatMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.passwordResetToken.findMany(),
  ]);

  const backupData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      databaseProvider: "postgresql",
      source: "Supabase PostgreSQL Database",
      totalRecords:
        users.length +
        stores.length +
        categories.length +
        products.length +
        orders.length +
        orderItems.length +
        supportTickets.length +
        reviews.length +
        notifications.length +
        chatMessages.length +
        passwordResetTokens.length,
    },
    tables: {
      users,
      stores,
      categories,
      products,
      orders,
      orderItems,
      supportTickets,
      reviews,
      notifications,
      chatMessages,
      passwordResetTokens,
    },
  };

  const backupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `full-database-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, filename);

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8");
  const stats = fs.statSync(backupPath);
  const fileSizeKb = Math.round(stats.size / 1024);
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("Table Record Counts:");
  console.log(` - Users:                 ${users.length}`);
  console.log(` - Stores:                ${stores.length}`);
  console.log(` - Categories:            ${categories.length}`);
  console.log(` - Products:              ${products.length}`);
  console.log(` - Orders:                ${orders.length}`);
  console.log(` - Order Items:           ${orderItems.length}`);
  console.log(` - Support Tickets:       ${supportTickets.length}`);
  console.log(` - Reviews:               ${reviews.length}`);
  console.log(` - Notifications:         ${notifications.length}`);
  console.log(` - Chat Messages:         ${chatMessages.length}`);
  console.log(` - Password Reset Tokens: ${passwordResetTokens.length}`);
  console.log("------------------------------------------");
  console.log(`TOTAL RECORDS BACKED UP:  ${backupData.metadata.totalRecords}`);
  console.log(`FILE SIZE:                ${fileSizeKb} KB`);
  console.log(`BACKUP DURATION:          ${durationSec}s`);
  console.log(`SAVED TO:                 ${backupPath}`);
  console.log("==========================================\n");
}

main()
  .catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

