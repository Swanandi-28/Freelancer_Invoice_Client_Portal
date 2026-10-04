import { NextResponse } from "next/server";
import mongoose from "mongoose";

/* ---------- Consistent JSON responses ---------- */

export function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export function serverError(label: string, error: unknown, message: string) {
  console.error(`${label}:`, error);
  return fail(message, 500);
}

/* ---------- Validation helpers ---------- */

export function isObjectId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value) &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

export function isEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
  );
}

export function cleanString(value: unknown, maxLength = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** Returns a positive, finite amount rounded to 2 decimals, or null. */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return null;
  return roundMoney(amount);
}

export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export async function readJson(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
