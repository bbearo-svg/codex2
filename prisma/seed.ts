import { Prisma, PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.capacityReservation.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItemOption.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.blackoutDate.deleteMany();
  await prisma.storeSetting.deleteMany();

  const adminPassword = await hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: adminPassword, role: Role.ADMIN, name: "Catering Admin" },
    create: {
      email: "admin@example.com",
      name: "Catering Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const categoriesData = [
    {
      name: "Breakfast Platters",
      description: "Morning favorites and fresh-baked goods for early meetings.",
      sort: 1,
      leadTimeDays: 2,
      dailyCapacity: 120,
      items: [
        {
          name: "Sunrise Pastry Assortment",
          description: "Croissants, muffins, and scones served warm.",
          basePrice: 45,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Serving Size",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Serves 10", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Serves 20", priceDelta: 35, sort: 1 },
              ],
            },
            {
              name: "Add-ons",
              min: 0,
              max: 2,
              sort: 1,
              options: [
                { name: "Seasonal Fruit", priceDelta: 15, sort: 0 },
                { name: "Greek Yogurt Parfaits", priceDelta: 20, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Hearty Breakfast Burritos",
          description: "Scrambled eggs, roasted veggies, and cheddar wrapped in flour tortillas.",
          basePrice: 60,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Protein",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Applewood Bacon", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Veggie Sausage", priceDelta: 5, sort: 1 },
              ],
            },
            {
              name: "Sides",
              min: 0,
              max: 2,
              sort: 1,
              options: [
                { name: "Fire-roasted salsa", priceDelta: 5, sort: 0 },
                { name: "Avocado crema", priceDelta: 8, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Cold Brew Bar",
          description: "Locally roasted cold brew with dairy and non-dairy accompaniments.",
          basePrice: 50,
          leadTimeDays: 1,
          modifiers: [
            {
              name: "Serving Size",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Serves 12", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Serves 24", priceDelta: 40, sort: 1 },
              ],
            },
            {
              name: "Milk Selection",
              min: 1,
              max: 2,
              sort: 1,
              options: [
                { name: "Whole Milk", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Oat Milk", priceDelta: 5, sort: 1 },
                { name: "Almond Milk", priceDelta: 5, sort: 2 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Midday Lunch",
      description: "Fresh salads, bowls, and sandwiches ideal for team lunches.",
      sort: 2,
      leadTimeDays: 2,
      dailyCapacity: 160,
      items: [
        {
          name: "Harvest Grain Bowls",
          description: "Farro, roasted vegetables, and herb dressing served family-style.",
          basePrice: 75,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Protein",
              min: 1,
              max: 2,
              sort: 0,
              options: [
                { name: "Citrus chicken", priceDelta: 12, sort: 0 },
                { name: "Roasted salmon", priceDelta: 18, sort: 1 },
                { name: "Marinated tofu", priceDelta: 10, sort: 2 },
              ],
            },
            {
              name: "Dressing",
              min: 1,
              max: 1,
              sort: 1,
              options: [
                { name: "Lemon herb", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Charred scallion", priceDelta: 0, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Artisan Sandwich Platter",
          description: "Chef-selected sandwiches on rustic breads with spreads and pickled vegetables.",
          basePrice: 68,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Bread",
              min: 1,
              max: 2,
              sort: 0,
              options: [
                { name: "Sourdough", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Ciabatta", priceDelta: 0, sort: 1 },
                { name: "Gluten free", priceDelta: 12, sort: 2 },
              ],
            },
            {
              name: "Sides",
              min: 0,
              max: 2,
              sort: 1,
              options: [
                { name: "House chips", priceDelta: 10, sort: 0 },
                { name: "Seasonal salad", priceDelta: 15, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Chef's Soup Service",
          description: "Slow-simmered soups delivered hot with garnishes.",
          basePrice: 55,
          leadTimeDays: 1,
          modifiers: [
            {
              name: "Soup selection",
              min: 1,
              max: 2,
              sort: 0,
              options: [
                { name: "Tomato basil", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Butternut squash", priceDelta: 5, sort: 1 },
                { name: "Chicken pozole", priceDelta: 8, sort: 2 },
              ],
            },
            {
              name: "Accompaniments",
              min: 0,
              max: 2,
              sort: 1,
              options: [
                { name: "Parmesan crisps", priceDelta: 6, sort: 0 },
                { name: "Herbed focaccia", priceDelta: 10, sort: 1 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Chef's Specials",
      description: "Elevated entrees perfect for evening events or VIP experiences.",
      sort: 3,
      leadTimeDays: 3,
      dailyCapacity: 90,
      items: [
        {
          name: "Seared Salmon Banquet",
          description: "Sustainably sourced salmon with roasted citrus glaze.",
          basePrice: 110,
          leadTimeDays: 3,
          modifiers: [
            {
              name: "Serving Size",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Serves 8", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Serves 16", priceDelta: 90, sort: 1 },
              ],
            },
            {
              name: "Sides",
              min: 1,
              max: 2,
              sort: 1,
              options: [
                { name: "Roasted fingerlings", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Charred broccolini", priceDelta: 12, sort: 1 },
                { name: "Wild rice pilaf", priceDelta: 15, sort: 2 },
              ],
            },
          ],
        },
        {
          name: "Lemon Thyme Chicken",
          description: "Free-range chicken roasted with preserved lemon and thyme jus.",
          basePrice: 95,
          leadTimeDays: 3,
          modifiers: [
            {
              name: "Serving Style",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Carved", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Individual plates", priceDelta: 25, sort: 1 },
              ],
            },
            {
              name: "Accompaniments",
              min: 1,
              max: 2,
              sort: 1,
              options: [
                { name: "Garlic whipped potatoes", priceDelta: 12, sort: 0 },
                { name: "Grilled asparagus", priceDelta: 15, sort: 1 },
                { name: "Citrus fennel salad", priceDelta: 14, sort: 2 },
              ],
            },
          ],
        },
        {
          name: "Seasonal Vegetable Paella",
          description: "Saffron rice with market vegetables and smoked paprika broth.",
          basePrice: 85,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Protein Enhancements",
              min: 0,
              max: 2,
              sort: 0,
              options: [
                { name: "Garlic shrimp", priceDelta: 20, sort: 0 },
                { name: "Chorizo", priceDelta: 18, sort: 1 },
              ],
            },
            {
              name: "Serving Size",
              min: 1,
              max: 1,
              sort: 1,
              options: [
                { name: "Serves 10", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Serves 20", priceDelta: 70, sort: 1 },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Desserts & Treats",
      description: "Sweet finishes from the pastry kitchen.",
      sort: 4,
      leadTimeDays: 2,
      dailyCapacity: 140,
      items: [
        {
          name: "Petite Dessert Bites",
          description: "Chef-curated mini desserts ideal for receptions.",
          basePrice: 58,
          leadTimeDays: 2,
          modifiers: [
            {
              name: "Selection",
              min: 1,
              max: 2,
              sort: 0,
              options: [
                { name: "Chocolate trio", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Seasonal fruit tarts", priceDelta: 10, sort: 1 },
                { name: "Chef's choice", priceDelta: 15, sort: 2 },
              ],
            },
            {
              name: "Serving Size",
              min: 1,
              max: 1,
              sort: 1,
              options: [
                { name: "24 pieces", priceDelta: 0, sort: 0, isDefault: true },
                { name: "48 pieces", priceDelta: 45, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Celebration Cake",
          description: "Three-layer cake with seasonal fillings and buttercream.",
          basePrice: 90,
          leadTimeDays: 3,
          modifiers: [
            {
              name: "Cake Flavor",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "Vanilla bean", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Chocolate espresso", priceDelta: 0, sort: 1 },
                { name: "Lemon elderflower", priceDelta: 10, sort: 2 },
              ],
            },
            {
              name: "Decor",
              min: 0,
              max: 2,
              sort: 1,
              options: [
                { name: "Pressed flowers", priceDelta: 18, sort: 0 },
                { name: "Gold leaf", priceDelta: 22, sort: 1 },
              ],
            },
          ],
        },
        {
          name: "Gourmet Cookie Box",
          description: "Assorted cookies baked daily with premium ingredients.",
          basePrice: 42,
          leadTimeDays: 1,
          modifiers: [
            {
              name: "Count",
              min: 1,
              max: 1,
              sort: 0,
              options: [
                { name: "24 cookies", priceDelta: 0, sort: 0, isDefault: true },
                { name: "48 cookies", priceDelta: 30, sort: 1 },
              ],
            },
            {
              name: "Assortment",
              min: 1,
              max: 2,
              sort: 1,
              options: [
                { name: "Classic favorites", priceDelta: 0, sort: 0, isDefault: true },
                { name: "Chef's seasonal", priceDelta: 8, sort: 1 },
                { name: "Gluten sensitive", priceDelta: 12, sort: 2 },
              ],
            },
          ],
        },
      ],
    },
  ];

  for (const [index, categoryData] of categoriesData.entries()) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
        sort: categoryData.sort,
        leadTimeDays: categoryData.leadTimeDays,
        dailyCapacity: categoryData.dailyCapacity,
        items: {
          create: categoryData.items.map((item) => ({
            name: item.name,
            description: item.description,
            basePrice: new Prisma.Decimal(item.basePrice),
            leadTimeDays: item.leadTimeDays,
            modifiers: {
              create: item.modifiers.map((modifier) => ({
                name: modifier.name,
                min: modifier.min,
                max: modifier.max,
                sort: modifier.sort,
                options: {
                  create: modifier.options.map((option) => ({
                    name: option.name,
                    priceDelta: new Prisma.Decimal(option.priceDelta),
                    sort: option.sort,
                    isDefault: option.isDefault ?? false,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: { items: true },
    });

    console.log(`Created category ${index + 1}: ${category.name}`);
  }

  await prisma.discount.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT",
      value: new Prisma.Decimal(10),
      minSubtotal: new Prisma.Decimal(200),
      active: true,
    },
  });

  await prisma.storeSetting.createMany({
    data: [
      { key: "taxRate", value: "0.0925" },
      { key: "deliveryFee", value: "25" },
      { key: "closedWeekdays", value: "0" },
    ],
  });

  await prisma.blackoutDate.createMany({
    data: [
      { date: new Date(new Date().getFullYear(), 11, 25), reason: "Holiday" },
      { date: new Date(new Date().getFullYear(), 0, 1), reason: "New Year's Day" },
    ],
  });

  console.log("Seed data created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
