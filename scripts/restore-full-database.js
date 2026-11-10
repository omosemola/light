const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const backupDir = path.join(__dirname, "..", "backups");
  const files = fs.readdirSync(backupDir).filter((f) => f.startsWith("full-database-backup-") && f.endsWith(".json"));
  
  if (files.length === 0) {
    console.error("No backup files found in 'backups/' directory.");
    process.exit(1);
  }

  // Pick the newest backup file
  files.sort().reverse();
  const backupFile = files[0];
  const backupPath = path.join(backupDir, backupFile);

  console.log("==========================================");
  console.log("   LIGHTSON PLATFORM - DATABASE RESTORE");
  console.log("==========================================");
  console.log(`Loading backup: ${backupFile}...\n`);

  const raw = fs.readFileSync(backupPath, "utf-8");
  const data = JSON.parse(raw);
  const { tables } = data;

  console.log("Restoring records in relational order...\n");

  // 1. Users
  console.log(`Restoring ${tables.users.length} Users...`);
  for (const u of tables.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u,
      create: u,
    });
  }

  // 2. Categories
  console.log(`Restoring ${tables.categories.length} Categories...`);
  for (const c of tables.categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }

  // 3. Stores
  console.log(`Restoring ${tables.stores.length} Stores...`);
  for (const s of tables.stores) {
    await prisma.store.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // 4. Products
  console.log(`Restoring ${tables.products.length} Products...`);
  for (const p of tables.products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // 5. Orders
  console.log(`Restoring ${tables.orders.length} Orders...`);
  for (const o of tables.orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: o,
      create: o,
    });
  }

  // 6. OrderItems
  console.log(`Restoring ${tables.orderItems.length} OrderItems...`);
  for (const oi of tables.orderItems) {
    await prisma.orderItem.upsert({
      where: { id: oi.id },
      update: oi,
      create: oi,
    });
  }

  // 7. Reviews
  console.log(`Restoring ${tables.reviews.length} Reviews...`);
  for (const r of tables.reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  // 8. Notifications
  console.log(`Restoring ${tables.notifications.length} Notifications...`);
  for (const n of tables.notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    });
  }

  // 9. SupportTickets
  console.log(`Restoring ${tables.supportTickets.length} SupportTickets...`);
  for (const st of tables.supportTickets) {
    await prisma.supportTicket.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    });
  }

  console.log("\n==========================================");
  console.log("DATABASE RESTORATION COMPLETED SUCCESSFULLY!");
  console.log("==========================================\n");
}

main()
  .catch((err) => {
    console.error("Restoration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

