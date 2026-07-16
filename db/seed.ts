import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import {
  users,
  receipts,
  receiptItems,
  products,
  aiInsights,
  tokenUsageLog,
  surplusListings,
  surplusReservations,
} from "./schema";

config({ path: ".env.local" });

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("🌱 Starting seed process...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const args = process.argv.slice(2);
    const userId = args.find((arg) => !arg.startsWith("--"));
    const shouldClean = args.includes("--clean");

    if (!userId) {
      console.error("❌ Error: Please provide a user ID as the first argument");
      console.log("Usage: npm run db:seed <user-id> [--clean]");
      console.log(
        "\nTo get your user ID, sign in first and check the 'user' table in your database.",
      );
      process.exit(1);
    }

    console.log(`📝 Seeding data for user ID: ${userId}`);

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (shouldClean) {
      console.log("🧹 Cleaning existing seedable data for this user...");

      const userProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.userId, userId));

      const productIds = userProducts.map((p) => p.id);

      const userListings = await db
        .select({ id: surplusListings.id })
        .from(surplusListings)
        .where(eq(surplusListings.userId, userId));

      const listingIds = userListings.map((l) => l.id);

      if (listingIds.length > 0) {
        await db
          .delete(surplusReservations)
          .where(inArray(surplusReservations.listingId, listingIds));
      }

      await db.delete(surplusListings).where(eq(surplusListings.userId, userId));
      await db.delete(tokenUsageLog).where(eq(tokenUsageLog.userId, userId));
      await db.delete(receipts).where(eq(receipts.userId, userId));

      if (productIds.length > 0) {
        await db.delete(aiInsights).where(inArray(aiInsights.productId, productIds));
      }

      await db.delete(products).where(eq(products.userId, userId));
      console.log("  ✓ Existing user data cleaned");
    }

    console.log("📦 Creating products...");
    const mockProducts = [
      {
        name: "Tomat Segar",
        sellingPrice: "11000.00",
        stock: 80,
        productionCost: "7800.00",
        category: "Fresh",
      },
      {
        name: "Bawang Merah",
        sellingPrice: "32000.00",
        stock: 46,
        productionCost: "24500.00",
        category: "Fresh",
      },
      {
        name: "Cabai Rawit",
        sellingPrice: "56000.00",
        stock: 25,
        productionCost: "44000.00",
        category: "Fresh",
      },
      {
        name: "Beras Premium 5kg",
        sellingPrice: "86000.00",
        stock: 36,
        productionCost: "73500.00",
        category: "Dry",
      },
      {
        name: "Minyak Goreng 2L",
        sellingPrice: "38000.00",
        stock: 64,
        productionCost: "31800.00",
        category: "Dry",
      },
      {
        name: "Teh Botol Sosro",
        sellingPrice: "3500.00",
        stock: 180,
        productionCost: "2350.00",
        category: "Beverage",
      },
      {
        name: "Aqua 600ml",
        sellingPrice: "2800.00",
        stock: 220,
        productionCost: "1850.00",
        category: "Beverage",
      },
      {
        name: "Kecap Manis",
        sellingPrice: "14500.00",
        stock: 72,
        productionCost: "10800.00",
        category: "Other",
      },
      {
        name: "Saos Sambal",
        sellingPrice: "17500.00",
        stock: 58,
        productionCost: "12800.00",
        category: "Other",
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(
        mockProducts.map((product) => ({
          userId,
          ...product,
        })),
      )
      .returning({ id: products.id, name: products.name });

    const productIdByName = new Map(insertedProducts.map((p) => [p.name, p.id]));
    console.log(`  ✓ Created ${insertedProducts.length} products`);

    console.log("\n💰 Creating receipts and receipt items...");
    const mockReceipts = [
      {
        date: formatDate(daysAgo(0)),
        merchantName: "Pasar Tradisional Kebayoran",
        category: "Fresh",
        items: [
          { name: "Tomat Segar", quantity: 6, unitPrice: "9000.00" },
          { name: "Bawang Merah", quantity: 3, unitPrice: "27000.00" },
          { name: "Cabai Rawit", quantity: 2, unitPrice: "47000.00" },
        ],
      },
      {
        date: formatDate(daysAgo(2)),
        merchantName: "Toko Sembako Jaya",
        category: "Dry",
        items: [
          { name: "Beras Premium 5kg", quantity: 2, unitPrice: "79000.00" },
          { name: "Minyak Goreng 2L", quantity: 4, unitPrice: "34000.00" },
        ],
      },
      {
        date: formatDate(daysAgo(5)),
        merchantName: "Supplier Minuman Jakarta",
        category: "Beverage",
        items: [
          { name: "Teh Botol Sosro", quantity: 24, unitPrice: "3000.00" },
          { name: "Aqua 600ml", quantity: 30, unitPrice: "2400.00" },
        ],
      },
      {
        date: formatDate(daysAgo(9)),
        merchantName: "Pasar Induk Kramat Jati",
        category: "Fresh",
        items: [
          { name: "Tomat Segar", quantity: 8, unitPrice: "8500.00" },
          { name: "Cabai Rawit", quantity: 2, unitPrice: "45500.00" },
        ],
      },
      {
        date: formatDate(daysAgo(14)),
        merchantName: "Toko Bumbu Dapur",
        category: "Other",
        items: [
          { name: "Kecap Manis", quantity: 5, unitPrice: "12500.00" },
          { name: "Saos Sambal", quantity: 4, unitPrice: "15500.00" },
        ],
      },
      {
        date: formatDate(daysAgo(22)),
        merchantName: "Grosir Nusantara",
        category: "Dry",
        items: [
          { name: "Beras Premium 5kg", quantity: 1, unitPrice: "80000.00" },
          { name: "Minyak Goreng 2L", quantity: 2, unitPrice: "35000.00" },
          { name: "Kecap Manis", quantity: 3, unitPrice: "13000.00" },
        ],
      },
      {
        date: formatDate(daysAgo(33)),
        merchantName: "Pusat Minuman Segar",
        category: "Beverage",
        items: [
          { name: "Teh Botol Sosro", quantity: 18, unitPrice: "3100.00" },
          { name: "Aqua 600ml", quantity: 24, unitPrice: "2350.00" },
        ],
      },
      {
        date: formatDate(daysAgo(48)),
        merchantName: "Pasar Subuh Cikini",
        category: "Fresh",
        items: [
          { name: "Tomat Segar", quantity: 7, unitPrice: "8800.00" },
          { name: "Bawang Merah", quantity: 4, unitPrice: "26500.00" },
        ],
      },
      {
        date: formatDate(daysAgo(67)),
        merchantName: "Distributor Harian",
        category: "Other",
        items: [
          { name: "Saos Sambal", quantity: 6, unitPrice: "15000.00" },
          { name: "Kecap Manis", quantity: 4, unitPrice: "12250.00" },
        ],
      },
      {
        date: formatDate(daysAgo(95)),
        merchantName: "Gudang Campuran",
        category: "Dry",
        items: [
          { name: "Minyak Goreng 2L", quantity: 3, unitPrice: "33800.00" },
          { name: "Beras Premium 5kg", quantity: 2, unitPrice: "77500.00" },
        ],
      },
    ];

    for (const receiptData of mockReceipts) {
      const grandTotal = receiptData.items.reduce((sum, item) => {
        return sum + Number(item.unitPrice) * item.quantity;
      }, 0);

      const [receipt] = await db
        .insert(receipts)
        .values({
          userId,
          date: receiptData.date,
          merchantName: receiptData.merchantName,
          grandTotal: grandTotal.toFixed(2),
          category: receiptData.category,
        })
        .returning();

      await db.insert(receiptItems).values(
        receiptData.items.map((item) => ({
          receiptId: receipt.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: (Number(item.unitPrice) * item.quantity).toFixed(2),
        })),
      );

      console.log(`  ✓ Created receipt from ${receiptData.merchantName}`);
    }

    console.log("\n🧠 Creating AI insights...");
    const insightsSeed = [
      {
        productName: "Tomat Segar",
        action: "restock",
        stockRange: "45-90",
        recommendation:
          "Penjualan tomat tinggi dalam 30 hari terakhir. Pertahankan stok pada kisaran 45-90 unit agar tidak cepat habis.",
      },
      {
        productName: "Teh Botol Sosro",
        action: "monitor",
        stockRange: "30-65",
        recommendation:
          "Permintaan teh botol stabil. Monitor tren mingguan dan jaga stok di kisaran 30-65 unit.",
      },
      {
        productName: "Saos Sambal",
        action: "reduce",
        stockRange: "15-35",
        recommendation:
          "Perputaran saos sambal relatif lambat. Pertimbangkan promo bundling dan turunkan stok ke 15-35 unit.",
      },
    ];

    const insightRows = insightsSeed
      .map((seedItem) => {
        const productId = productIdByName.get(seedItem.productName);
        if (!productId) return null;
        return {
          productId,
          action: seedItem.action,
          stockRange: seedItem.stockRange,
          recommendation: seedItem.recommendation,
        };
      })
      .filter(Boolean) as Array<{
      productId: number;
      action: string;
      stockRange: string;
      recommendation: string;
    }>;

    if (insightRows.length > 0) {
      await db.insert(aiInsights).values(insightRows);
      console.log(`  ✓ Created ${insightRows.length} AI insights`);
    }

    console.log("\n📊 Creating token usage logs...");
    const tokenRows = [
      {
        callSite: "dashboard",
        model: "gemini-2.5-flash",
        inputTokens: 780,
        outputTokens: 190,
        totalTokens: 970,
        durationMs: 420,
        createdAt: daysAgo(0),
      },
      {
        callSite: "ocr",
        model: "gemini-2.5-flash",
        inputTokens: 1400,
        outputTokens: 240,
        totalTokens: 1640,
        durationMs: 900,
        createdAt: daysAgo(1),
      },
      {
        callSite: "product_insights",
        model: "gemini-2.5-flash",
        inputTokens: 860,
        outputTokens: 230,
        totalTokens: 1090,
        durationMs: 520,
        createdAt: daysAgo(3),
      },
      {
        callSite: "chat",
        model: "gemini-2.5-flash",
        inputTokens: 620,
        outputTokens: 350,
        totalTokens: 970,
        durationMs: 610,
        createdAt: daysAgo(6),
      },
      {
        callSite: "ocr",
        model: "gemini-2.5-flash",
        inputTokens: 1280,
        outputTokens: 210,
        totalTokens: 1490,
        durationMs: 840,
        createdAt: daysAgo(10),
      },
      {
        callSite: "dashboard",
        model: "gemini-2.5-flash",
        inputTokens: 700,
        outputTokens: 170,
        totalTokens: 870,
        durationMs: 390,
        createdAt: daysAgo(14),
      },
    ];

    await db.insert(tokenUsageLog).values(
      tokenRows.map((row) => ({
        userId,
        ...row,
      })),
    );
    console.log(`  ✓ Created ${tokenRows.length} token usage logs`);

    console.log("\n🛒 Creating surplus listings and reservations...");
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [listingA] = await db
      .insert(surplusListings)
      .values({
        userId,
        productId: productIdByName.get("Tomat Segar") ?? null,
        sourceType: "manual",
        title: "Tomat Segar Grade B",
        description: "Kualitas masih baik untuk masak harian, harga diskon karena stok berlebih.",
        unitLabel: "kg",
        quantity: 30,
        remainingQuantity: 18,
        price: "7500.00",
        status: "active",
        expiresAt: threeDaysLater,
      })
      .returning({ id: surplusListings.id });

    const [listingB] = await db
      .insert(surplusListings)
      .values({
        userId,
        productId: productIdByName.get("Minyak Goreng 2L") ?? null,
        sourceType: "manual",
        title: "Paket Minyak + Kecap Promo",
        description: "Paket cepat habis, cocok untuk warung sekitar.",
        unitLabel: "paket",
        quantity: 12,
        remainingQuantity: 0,
        price: "42000.00",
        status: "reserved",
        expiresAt: fiveDaysLater,
      })
      .returning({ id: surplusListings.id });

    const [listingC] = await db
      .insert(surplusListings)
      .values({
        userId,
        productId: productIdByName.get("Teh Botol Sosro") ?? null,
        sourceType: "manual",
        title: "Teh Botol Near-Expiry",
        description: "Masa simpan mendekati tanggal batas, masih layak konsumsi.",
        unitLabel: "dus",
        quantity: 8,
        remainingQuantity: 2,
        price: "58000.00",
        status: "active",
        expiresAt: oneDayAgo,
      })
      .returning({ id: surplusListings.id });

    await db.insert(surplusReservations).values([
      {
        listingId: listingA.id,
        guestName: "Ari Setiawan",
        guestEmail: "ari@example.com",
        guestPhone: "081234567890",
        confirmationCode: `LSA${Date.now().toString().slice(-6)}`,
        quantity: 8,
        status: "pending",
        expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        notes: "Ambil sore jam 17:00",
      },
      {
        listingId: listingA.id,
        guestName: "Nadia Putri",
        guestEmail: "nadia@example.com",
        guestPhone: "082112223333",
        confirmationCode: `LSB${(Date.now() + 1).toString().slice(-6)}`,
        quantity: 4,
        status: "picked_up",
        pickupAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        notes: "Sudah diambil tepat waktu",
      },
      {
        listingId: listingB.id,
        guestName: "Warung Maju Jaya",
        guestPhone: "081398887776",
        confirmationCode: `LSC${(Date.now() + 2).toString().slice(-6)}`,
        quantity: 12,
        status: "picked_up",
        pickupAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        notes: "Reseller tetap",
      },
      {
        listingId: listingC.id,
        guestName: "Budi Santoso",
        guestPhone: "081211118888",
        confirmationCode: `LSD${(Date.now() + 3).toString().slice(-6)}`,
        quantity: 2,
        status: "expired",
        expiresAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        notes: "Tidak jadi diambil",
      },
    ]);

    console.log("  ✓ Created 3 surplus listings");
    console.log("  ✓ Created 4 surplus reservations");

    console.log("\n✅ Seed completed successfully!");
    console.log(`   - User: ${user.name || user.email || user.id}`);
    console.log(`   - ${mockProducts.length} products created`);
    console.log(`   - ${mockReceipts.length} receipts created`);
    console.log(`   - ${insightRows.length} AI insights created`);
    console.log(`   - ${tokenRows.length} token usage logs created`);
    console.log("   - 3 surplus listings created");
    console.log("   - 4 surplus reservations created");
    console.log("   - Active surplus listings: 2");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
