import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import { users, products, aiInsights } from "./schema";

config({ path: ".env.local" });

const TARGET_EMAIL = "rafa100609@gmail.com";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, TARGET_EMAIL));

    if (!user) {
      throw new Error(`User not found: ${TARGET_EMAIL}`);
    }

    const userProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.userId, user.id));

    const productIds = userProducts.map((product) => product.id);

    if (productIds.length === 0) {
      console.log("No products found for user; nothing to clear.");
      return;
    }

    await db
      .delete(aiInsights)
      .where(inArray(aiInsights.productId, productIds));

    console.log("✅ Cleared AI insights for", TARGET_EMAIL);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("❌ Clear failed:", error);
  process.exit(1);
});
