import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lightson Marketplace categories on Supabase...");

  // 1. Create All 15 Campus Marketplace Categories
  const categoriesData = [
    { id: "food", name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80" },
    { id: "snacks", name: "Snacks", image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80" },
    { id: "drinks", name: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80" },
    { id: "groceries", name: "Groceries", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80" },
    { id: "pastries", name: "Pastries", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80" },
    { id: "medical", name: "Medical", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80" },
    { id: "laundry", name: "Laundry", image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=300&q=80" },
    { id: "stationery", name: "Stationery", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80" },
    { id: "care", name: "Care", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80" },
    { id: "sports", name: "Sports", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80" },
    { id: "wears", name: "Wears", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80" },
    { id: "jewelries", name: "Jewelries", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80" },
    { id: "gadgets", name: "Gadgets", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80" },
    { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
    { id: "electronics", name: "Electronics", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80" },
    { id: "services", name: "Services", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80" },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, image: cat.image },
      create: {
        id: cat.id,
        name: cat.name,
        image: cat.image,
      },
    });
  }

  // 2. Seed Verified Service Vendors & Products
  const samplePasswordHash = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyGQV3bCjK2X8gXp0s3pW0gZ8eXk2gqK";

  // Laundry Vendor
  const laundryUser = await prisma.user.upsert({
    where: { email: "cleanwash@lightsonmarketplace.com" },
    update: {},
    create: {
      email: "cleanwash@lightsonmarketplace.com",
      name: "CleanWash Campus Laundry",
      phone: "+2348031122334",
      role: "VENDOR",
      password: samplePasswordHash,
    },
  });

  const laundryStore = await prisma.store.upsert({
    where: { userId: laundryUser.id },
    update: {
      name: "CleanWash Campus Laundry",
      description: "Hostel clothes pickup, washing, ironing, duvet wash & fast 24hr delivery to all campus halls.",
      logo: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=300&q=80",
      isOpen: true,
      isVerified: true,
      estimatedDelivery: "24 hours",
      rating: 4.9,
      phone: "+2348031122334",
    },
    create: {
      userId: laundryUser.id,
      name: "CleanWash Campus Laundry",
      description: "Hostel clothes pickup, washing, ironing, duvet wash & fast 24hr delivery to all campus halls.",
      logo: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=300&q=80",
      isOpen: true,
      isVerified: true,
      estimatedDelivery: "24 hours",
      rating: 4.9,
      phone: "+2348031122334",
    },
  });

  await prisma.product.upsert({
    where: { slug: "cleanwash-full-load-wash-and-iron" },
    update: {
      name: "Full Load Wash & Iron (Up to 15 Clothes)",
      price: 3500,
      image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
      description: "Gentle wash, sun-dry, crisp iron, and packaging. Free hostel collection & room delivery.",
      categoryId: "services",
      storeId: laundryStore.id,
      isAvailable: true,
    },
    create: {
      slug: "cleanwash-full-load-wash-and-iron",
      name: "Full Load Wash & Iron (Up to 15 Clothes)",
      price: 3500,
      image: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80",
      description: "Gentle wash, sun-dry, crisp iron, and packaging. Free hostel collection & room delivery.",
      categoryId: "services",
      storeId: laundryStore.id,
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "cleanwash-duvet-blanket-deep-wash" },
    update: {
      name: "Duvet & Heavy Blanket Deep Wash",
      price: 2500,
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80",
      description: "Deep fragrance wash for large student duvets, blankets, and bedspreads.",
      categoryId: "services",
      storeId: laundryStore.id,
      isAvailable: true,
    },
    create: {
      slug: "cleanwash-duvet-blanket-deep-wash",
      name: "Duvet & Heavy Blanket Deep Wash",
      price: 2500,
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80",
      description: "Deep fragrance wash for large student duvets, blankets, and bedspreads.",
      categoryId: "services",
      storeId: laundryStore.id,
      isAvailable: true,
    },
  });

  // Pharmacy & Medical Vendor
  const medUser = await prisma.user.upsert({
    where: { email: "carehealth@lightsonmarketplace.com" },
    update: {},
    create: {
      email: "carehealth@lightsonmarketplace.com",
      name: "CarePoint Campus Pharmacy",
      phone: "+2348055667788",
      role: "VENDOR",
      password: samplePasswordHash,
    },
  });

  const medStore = await prisma.store.upsert({
    where: { userId: medUser.id },
    update: {
      name: "CarePoint Campus Pharmacy & Health",
      description: "Verified student pharmacy & dispensary. Discreet, fast hostel delivery for OTC medicines, vitamins & essentials.",
      logo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80",
      isOpen: true,
      isVerified: true,
      estimatedDelivery: "15-25 mins",
      rating: 5.0,
      phone: "+2348055667788",
    },
    create: {
      userId: medUser.id,
      name: "CarePoint Campus Pharmacy & Health",
      description: "Verified student pharmacy & dispensary. Discreet, fast hostel delivery for OTC medicines, vitamins & essentials.",
      logo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80",
      isOpen: true,
      isVerified: true,
      estimatedDelivery: "15-25 mins",
      rating: 5.0,
      phone: "+2348055667788",
    },
  });

  await prisma.product.upsert({
    where: { slug: "carepoint-campus-first-aid-care-pack" },
    update: {
      name: "Campus First Aid & Pain Relief Care Pack",
      price: 2200,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
      description: "Includes paracetamol, band-aids, antiseptics, cotton wool, and pain relief balm for hostel emergencies.",
      categoryId: "services",
      storeId: medStore.id,
      isAvailable: true,
    },
    create: {
      slug: "carepoint-campus-first-aid-care-pack",
      name: "Campus First Aid & Pain Relief Care Pack",
      price: 2200,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
      description: "Includes paracetamol, band-aids, antiseptics, cotton wool, and pain relief balm for hostel emergencies.",
      categoryId: "services",
      storeId: medStore.id,
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "carepoint-vitamin-c-immune-defense" },
    update: {
      name: "Vitamin C 1000mg & Immune Defense Booster",
      price: 1500,
      image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80",
      description: "Effervescent Vitamin C + Zinc tablets for exam stress, fatigue, and flu defense.",
      categoryId: "services",
      storeId: medStore.id,
      isAvailable: true,
    },
    create: {
      slug: "carepoint-vitamin-c-immune-defense",
      name: "Vitamin C 1000mg & Immune Defense Booster",
      price: 1500,
      image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80",
      description: "Effervescent Vitamin C + Zinc tablets for exam stress, fatigue, and flu defense.",
      categoryId: "services",
      storeId: medStore.id,
      isAvailable: true,
    },
  });

  console.log("Database seeded successfully with all categories and service vendors!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

