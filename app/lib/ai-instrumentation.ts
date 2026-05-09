import "server-only";

import { getDb } from "@/db";
import { tokenUsageLog } from "@/db/schema";

export type AICallSite = "chat" | "ocr" | "product_insights" | "dashboard";

type UsageLike = {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
};

const normalizeModelName = (model: string) => model.trim().toLowerCase();

const estimateTokens = (text: string, model: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const charFactor = normalizeModelName(model).includes("flash") ? 3.6 : 4;
  return Math.max(1, Math.ceil(trimmed.length / charFactor));
};

const extractUsage = (value: unknown): UsageLike | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as {
    totalUsage?: UsageLike;
    usage?: UsageLike;
  };

  return record.totalUsage ?? record.usage ?? null;
};

export async function countTokens(text: string, model: string): Promise<number> {
  return estimateTokens(text, model);
}

export async function logTokenUsage(
  userId: string,
  callSite: AICallSite,
  inputTokens: number,
  outputTokens: number,
  model: string,
  durationMs = 0,
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(tokenUsageLog).values({
      userId,
      callSite,
      model,
      inputTokens: Math.max(0, Math.round(inputTokens)),
      outputTokens: Math.max(0, Math.round(outputTokens)),
      totalTokens: Math.max(0, Math.round(inputTokens + outputTokens)),
      durationMs: Math.max(0, Math.round(durationMs)),
    });
  } catch (error) {
    console.warn("Failed to log AI token usage", error);
  }
}

export async function measureApiCall<T>(
  fn: () => Promise<T>,
  callSite: AICallSite,
  userId: string,
  model: string,
): Promise<T> {
  const startedAt = Date.now();
  const result = await fn();
  const usage = extractUsage(result);

  if (usage) {
    await logTokenUsage(
      userId,
      callSite,
      usage.inputTokens,
      usage.outputTokens,
      model,
      Date.now() - startedAt,
    );
  }

  return result;
}