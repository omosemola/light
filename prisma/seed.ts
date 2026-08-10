import { PrismaClient, Role, OrderStatus, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lightson Marketplace database on Supabase...");

  // 1. Create Categories
  const categoriesData = [
    { name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80" },
    { name: "Snacks", image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80" },
    { name: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80" },
    { name: "Groceries", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80" },
    { name: "Pastries", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80" },
    { name: "Stationery", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80" },
    { name: "Care", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80" },
    { name: "Sports Wears", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80" },
    { name: "Jewelries", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80" },
    { name: "Gadgets & Accessories", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" },
    { name: "Electronics", image: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=300&q=80" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const id = cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const created = await prisma.category.upsert({
      where: { id },
      update: { image: cat.image },
      create: {
        id,
        name: cat.name,
        image: cat.image,
      },
    });
    categories.push(created);
  }

  // 2. Create Users & Stores
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@campuslight.com" },
    update: {},
    create: {
      email: "admin@campuslight.com",
      name: "Super Admin",
      role: Role.ADMIN,
      phone: "+2348000000000",
    },
  });

  const vendorUser1 = await prisma.user.upsert({
    where: { email: "mamacass@campuslight.com" },
    update: {},
    create: {
      email: "mamacass@campuslight.com",
      name: "Mama Cass Kitchen",
      role: Role.VENDOR,
      phone: "+2348123456781",
    },
  });

  const store1 = await prisma.store.upsert({
    where: { userId: vendorUser1.id },
    update: {},
    create: {
      name: "Mama Cass",
      description: "Authentic Nigerian party Jollof, Fried Rice, and local delicacies.",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
      isOpen: true,
      estimatedDelivery: "25-35 mins",
      rating: 4.9,
      userId: vendorUser1.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "alex.johnson@gmail.com" },
    update: {},
    create: {
      email: "alex.johnson@gmail.com",
      name: "Alex Johnson",
      role: Role.STUDENT,
      phone: "+2348123456789",
    },
  });

  // 3. Create Products for Store 1
  const foodCat = categories.find((c) => c.name === "Food");
  const drinksCat = categories.find((c) => c.name === "Drinks");

  const p1 = await prisma.product.create({
    data: {
      name: "Jollof Rice with Chicken & Plantain",
      price: 3500,
      description: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and grilled chicken.",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      storeId: store1.id,
      categoryId: foodCat?.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Cold Pressed Orange Juice 50cl",
      price: 1200,
      description: "100% natural, freshly squeezed orange juice with no added sugar.",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
      isAvailable: true,
      storeId: store1.id,
      categoryId: drinksCat?.id,
    },
  });

  // 4. Create Sample Orders
  const order1 = await prisma.order.create({
    data: {
      totalAmount: 4700,
      status: OrderStatus.PREPARING,
      deliveryLocation: "Main Campus (Mellanby Hall, Room B12)",
      deliveryInstructions: "Call when at the portal gate",
      paymentReference: `PAY-${Date.now()}-1`,
      userId: studentUser.id,
      storeId: store1.id,
      items: {
        create: [
          { productId: p1.id, quantity: 1, price: 3500 },
          { productId: p2.id, quantity: 1, price: 1200 },
        ],
      },
    },
  });

  // 5. Create Sample Support Ticket
  await prisma.supportTicket.create({
    data: {
      subject: "Order delay inquiry",
      category: "Delivery",
      message: "My order #104 is taking longer than estimated delivery time.",
      status: TicketStatus.OPEN,
      userId: studentUser.id,
      orderId: order1.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
