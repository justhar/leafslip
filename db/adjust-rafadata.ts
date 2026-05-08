import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import { users, products, receipts, receiptItems } from "./schema";

config({ path: ".env.local" });

const TARGET_EMAIL = "rafa100609@gmail.com";
const QUANTITY_RANGE = { min: 100, max: 500 };
const PRICE_RANGE = { min: 20_000, max: 100_000 };
const DATE_RANGE_DAYS = 60;
const RECEIPT_BUDGET_CAP = 95_000_000;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDateString = (daysBack: number) => {
  const now = new Date();
  const offset = randomInt(0, daysBack);
  const date = new Date(now);
  date.setDate(now.getDate() - offset);
  return date.toISOString().slice(0, 10);
};

const toMoneyString = (value: number) => Math.round(value).toString();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, TARGET_EMAIL));

    if (!user) {
      throw new Error(`User not found: ${TARGET_EMAIL}`);
    }

    const userProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.userId, user.id));

    const userReceipts = await db
      .select({ id: receipts.id })
      .from(receipts)
      .where(eq(receipts.userId, user.id));

    console.log("Found user:", user.email);
    console.log(`Products: ${userProducts.length}`);
    console.log(`Receipts: ${userReceipts.length}`);

    for (const product of userProducts) {
      const sellingPrice = randomInt(PRICE_RANGE.min, PRICE_RANGE.max);
      const stock = randomInt(QUANTITY_RANGE.min, QUANTITY_RANGE.max);
      const productionCost = Math.max(
        Math.round(sellingPrice * 0.7),
        Math.round(PRICE_RANGE.min * 0.5),
      );

      await db
        .update(products)
        .set({
          sellingPrice: toMoneyString(sellingPrice),
          stock,
          productionCost: toMoneyString(productionCost),
        })
        .where(eq(products.id, product.id));
    }

    if (userReceipts.length > 0) {
      const receiptIds = userReceipts.map((receipt) => receipt.id);

      const items = await db
        .select({
          id: receiptItems.id,
          receiptId: receiptItems.receiptId,
        })
        .from(receiptItems)
        .where(inArray(receiptItems.receiptId, receiptIds));

      const itemsByReceipt = new Map<number, typeof items>();
      for (const item of items) {
        const list = itemsByReceipt.get(item.receiptId) ?? [];
        list.push(item);
        itemsByReceipt.set(item.receiptId, list);
      }

      const totalsByReceipt = new Map<number, number>();

      for (const [receiptId, receiptItemsList] of itemsByReceipt.entries()) {
        let remainingBudget = RECEIPT_BUDGET_CAP;
        let remainingItems = receiptItemsList.length;

        for (const item of receiptItemsList) {
          let quantity = randomInt(QUANTITY_RANGE.min, QUANTITY_RANGE.max);
          const maxUnitPrice = Math.floor(
            remainingBudget / Math.max(1, remainingItems) / Math.max(1, quantity),
          );
          let unitPriceMax = Math.min(
            PRICE_RANGE.max,
            Math.max(PRICE_RANGE.min, maxUnitPrice),
          );
          let unitPrice = randomInt(PRICE_RANGE.min, unitPriceMax);

          if (maxUnitPrice < PRICE_RANGE.min) {
            const maxQtyForMinPrice = Math.max(
              1,
              Math.floor(
                remainingBudget /
                  Math.max(1, remainingItems) /
                  PRICE_RANGE.min,
              ),
            );
            quantity = Math.min(quantity, maxQtyForMinPrice);
            unitPrice = PRICE_RANGE.min;
          }

          const total = quantity * unitPrice;
          remainingBudget = Math.max(0, remainingBudget - total);
          remainingItems = Math.max(0, remainingItems - 1);

          await db
            .update(receiptItems)
            .set({
              quantity,
              unitPrice: toMoneyString(unitPrice),
              total: toMoneyString(total),
            })
            .where(eq(receiptItems.id, item.id));

          totalsByReceipt.set(
            receiptId,
            (totalsByReceipt.get(receiptId) ?? 0) + total,
          );
        }
      }

      for (const receipt of userReceipts) {
        const grandTotal = totalsByReceipt.get(receipt.id) ?? 0;
        const date = randomDateString(DATE_RANGE_DAYS);

        await db
          .update(receipts)
          .set({
            grandTotal: toMoneyString(grandTotal),
            date,
          })
          .where(eq(receipts.id, receipt.id));
      }
    }

    console.log("✅ Rafa data updated with new variability.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("❌ Update failed:", error);
  process.exit(1);
});
