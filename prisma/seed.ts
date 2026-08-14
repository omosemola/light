import { PrismaClient, Role, OrderStatus, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lightson Marketplace database on Supabase...");

  // 1. Create All 12 Campus Categories
  const categoriesData = [
    { id: "food", name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80" },
    { id: "snacks", name: "Snacks", image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80" },
    { id: "drinks", name: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80" },
    { id: "groceries", name: "Groceries", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80" },
    { id: "pastries", name: "Pastries", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80" },
    { id: "stationery", name: "Stationery", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80" },
    { id: "care", name: "Care", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80" },
    { id: "sports", name: "Sports", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80" },
    { id: "wears", name: "Wears", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80" },
    { id: "jewelries", name: "Jewelries", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=300&q=80" },
    { id: "gadgets", name: "Gadgets", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80" },
    { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80" },
    { id: "electronics", name: "Electronics", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80" },
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

  // 2. Create Campus Vendors & Stores
  const vendors = [
    {
      email: "mamacass@campuslightson.com",
      name: "Mama Cass Kitchen",
      storeName: "Mama Cass",
      description: "Authentic Nigerian party Jollof, Fried Rice, and local delicacies.",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      phone: "+234 812 345 9900",
      products: [
        { name: "Jollof Rice with Chicken & Plantain", price: 3500, catId: "food", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80", desc: "Authentic Nigerian party Jollof rice served hot with crispy fried plantain and grilled chicken." },
        { name: "Fried Rice Combo with Grilled Turkey", price: 4200, catId: "food", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80", desc: "Seasoned vegetable fried rice served with succulent grilled turkey wing and coleslaw." },
        { name: "Peppered Chicken Drumsticks (3 pcs)", price: 2800, catId: "snacks", image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80", desc: "Tender chicken drumsticks tossed in fiery habanero and sweet bell pepper sauce." },
      ]
    },
    {
      email: "pizzahub@campuslightson.com",
      name: "Pizza Hub",
      storeName: "Pizza Hub",
      description: "Freshly hand-tossed pizzas topped with beef suya, double mozzarella cheese, and signature fiery spices.",
      logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
      phone: "+234 809 777 8899",
      products: [
        { name: "Spicy Beef Suya Pizza - Medium", price: 6500, catId: "food", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", desc: "Freshly baked pizza topped with spicy beef suya, onions, and melted mozzarella cheese." },
        { name: "BBQ Chicken Supreme Pizza - Large", price: 8500, catId: "food", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", desc: "Tender shredded BBQ chicken, sweet corn, bell peppers, and signature smoky sauce." },
      ]
    },
    {
      email: "freshsqueeze@campuslightson.com",
      name: "Fresh Squeeze Juices",
      storeName: "Fresh Squeeze",
      description: "100% cold-pressed natural fruit juices, iced boba teas, and fruit smoothies with zero preservatives.",
      logo: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      phone: "+234 803 444 5566",
      products: [
        { name: "Cold Pressed Orange Juice 50cl", price: 1200, catId: "drinks", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80", desc: "100% natural, freshly squeezed orange juice with no added sugar." },
        { name: "Chilled Zobo Drink with Mint & Ginger 50cl", price: 700, catId: "drinks", image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80", desc: "Traditional hibiscus flower brew infused with fresh ginger, pineapple chunks, and mint leaves." },
      ]
    },
    {
      email: "campusmart@campuslightson.com",
      name: "Campus Mini Mart",
      storeName: "Campus Mini Mart",
      description: "Hostel provisions, instant noodles, milk, cereals, beverages, and daily grooming essentials.",
      logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80",
      phone: "+234 816 222 3344",
      products: [
        { name: "Golden Morn Cereal 400g + Peak Milk 350g Combo", price: 3800, catId: "groceries", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80", desc: "Nutritious whole grain maize & soya breakfast cereal paired with full cream instant milk powder." },
        { name: "Indomie Instant Noodles Hungryman Size (Pack of 5)", price: 3200, catId: "groceries", image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80", desc: "Classic onion chicken flavor instant noodles, 180g jumbo hunger-buster packs." },
      ]
    },
    {
      email: "techhub@campuslightson.com",
      name: "Tech & Gadget Hub",
      storeName: "Tech & Gadget Hub",
      description: "Original fast chargers, high-capacity power banks, braided cables, wireless earbuds, and study accessories.",
      logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80",
      coverImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
      phone: "+234 815 333 4455",
      products: [
        { name: "20,000mAh Fast Charging Power Bank 22.5W", price: 14500, catId: "gadgets", image: "https://images.unsplash.com/photo-1609592424364-e408ec228499?auto=format&fit=crop&w=800&q=80", desc: "Dual USB-A and USB-C power delivery portable charger with LED digital battery display." },
        { name: "Braided 65W Fast Charge USB-C to USB-C Cable (2m)", price: 3500, catId: "gadgets", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80", desc: "Ultra-durable nylon braided cable supporting super fast charging for laptops, phones, and tablets." },
      ]
    }
  ];

  for (const v of vendors) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: { name: v.name, phone: v.phone },
      create: {
        email: v.email,
        name: v.name,
        role: Role.VENDOR,
        phone: v.phone,
      },
    });

    const store = await prisma.store.upsert({
      where: { userId: user.id },
      update: {
        name: v.storeName,
        description: v.description,
        logo: v.logo,
        coverImage: v.coverImage,
      },
      create: {
        name: v.storeName,
        description: v.description,
        logo: v.logo,
        coverImage: v.coverImage,
        isOpen: true,
        userId: user.id,
      },
    });

    for (const prod of v.products) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: prod.name, storeId: store.id },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            name: prod.name,
            price: prod.price,
            description: prod.desc,
            image: prod.image,
            isAvailable: true,
            storeId: store.id,
            categoryId: prod.catId,
          },
        });
      }
    }
  }

  console.log("Database seeded successfully with all 12 categories, campus stores, and live products!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
