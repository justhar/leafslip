import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { receipts, receiptItems, products } from "./schema";

config({ path: ".env.local" });

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("🌱 Starting seed process...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    // Get user ID from command line argument
    const userId = process.argv[2];
    if (!userId) {
      console.error("❌ Error: Please provide a user ID as the first argument");
      console.log("Usage: npm run db:seed <user-id>");
      console.log(
        "\nTo get your user ID, sign in first and check the 'user' table in your database.",
      );
      process.exit(1);
    }

    console.log(`📝 Seeding data for user ID: ${userId}`);

    // Seed receipts
    console.log("💰 Creating receipts...");
    const mockReceipts = [
      {
        date: "2026-01-09",
        merchantName: "Pasar Tradisional Kebayoran",
        grandTotal: "135000",
        category: "Fresh",
        items: [
          { name: "Tomat", quantity: 5, unitPrice: "8000", total: "40000" },
          {
            name: "Bawang Merah",
            quantity: 2,
            unitPrice: "25000",
            total: "50000",
          },
          {
            name: "Cabai Rawit",
            quantity: 1,
            unitPrice: "45000",
            total: "45000",
          },
        ],
      },
      {
        date: "2026-01-08",
        merchantName: "Toko Sembako Jaya",
        grandTotal: "246000",
        category: "Dry",
        items: [
          {
            name: "Beras Premium 5kg",
            quantity: 2,
            unitPrice: "75000",
            total: "150000",
          },
          {
            name: "Minyak Goreng 2L",
            quantity: 3,
            unitPrice: "32000",
            total: "96000",
          },
        ],
      },
      {
        date: "2026-01-07",
        merchantName: "Supplier Minuman Jakarta",
        grandTotal: "138000",
        category: "Beverage",
        items: [
          {
            name: "Teh Botol Sosro (24 pcs)",
            quantity: 2,
            unitPrice: "48000",
            total: "96000",
          },
          {
            name: "Aqua 600ml (24 pcs)",
            quantity: 1,
            unitPrice: "42000",
            total: "42000",
          },
        ],
      },
      {
        date: "2026-01-06",
        merchantName: "Pasar Induk Kramat Jati",
        grandTotal: "189000",
        category: "Fresh",
        items: [
          {
            name: "Ayam Broiler",
            quantity: 3,
            unitPrice: "35000",
            total: "105000",
          },
          {
            name: "Telur Ayam (30 butir)",
            quantity: 2,
            unitPrice: "42000",
            total: "84000",
          },
        ],
      },
      {
        date: "2026-01-05",
        merchantName: "Toko Bumbu Dapur",
        grandTotal: "111000",
        category: "Other",
        items: [
          {
            name: "Kecap Manis",
            quantity: 5,
            unitPrice: "12000",
            total: "60000",
          },
          {
            name: "Saos Sambal",
            quantity: 3,
            unitPrice: "15000",
            total: "45000",
          },
          {
            name: "Garam Dapur",
            quantity: 2,
            unitPrice: "3000",
            total: "6000",
          },
        ],
      },
    ];

    for (const receiptData of mockReceipts) {
      const [receipt] = await db
        .insert(receipts)
        .values({
          userId,
          date: receiptData.date,
          merchantName: receiptData.merchantName,
          grandTotal: receiptData.grandTotal,
          category: receiptData.category,
        })
        .returning();

      await db.insert(receiptItems).values(
        receiptData.items.map((item) => ({
          receiptId: receipt.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      );

      console.log(`  ✓ Created receipt from ${receiptData.merchantName}`);
    }

    // Seed products
    console.log("\n📦 Creating products...");
    const mockProducts = [
      {
        name: "Tomat Segar",
        sellingPrice: "10000",
        stock: 50,
        productionCost: "7000",
        category: "Fresh",
      },
      {
        name: "Bawang Merah",
        sellingPrice: "30000",
        stock: 25,
        productionCost: "22000",
        category: "Fresh",
      },
      {
        name: "Cabai Rawit",
        sellingPrice: "50000",
        stock: 15,
        productionCost: "40000",
        category: "Fresh",
      },
      {
        name: "Beras Premium 5kg",
        sellingPrice: "80000",
        stock: 30,
        productionCost: "70000",
        category: "Dry",
      },
      {
        name: "Minyak Goreng 2L",
        sellingPrice: "35000",
        stock: 40,
        productionCost: "30000",
        category: "Dry",
      },
      {
        name: "Teh Botol Sosro",
        sellingPrice: "3000",
        stock: 100,
        productionCost: "2000",
        category: "Beverage",
      },
    ];

    for (const productData of mockProducts) {
      await db.insert(products).values({
        userId,
        ...productData,
      });
      console.log(`  ✓ Created product: ${productData.name}`);
    }

    console.log("\n✅ Seed completed successfully!");
    console.log(`   - ${mockReceipts.length} receipts created`);
    console.log(`   - ${mockProducts.length} products created`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
