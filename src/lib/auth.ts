import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const COOKIE = "agency_session";
const TTL = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) throw new Error("SESSION_SECRET harus minimal 24 karakter");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function sessionToken(userId: string) {
  const payload = `${userId}~${Math.floor(Date.now() / 1000) + TTL}`;
  return `${payload}.${signature(payload)}`;
}

/** Mengembalikan userId bila token sah dan belum kedaluwarsa. */
export function validSession(token?: string): string | null {
  if (!token) return null;
  const [payload, given, extra] = token.split(".");
  if (!payload || !given || extra) return null;
  const [userId, exp] = payload.split("~");
  if (!userId || !/^\d+$/.test(exp ?? "") || Number(exp) <= Date.now() / 1000) return null;
  const expected = Buffer.from(signature(payload), "hex");
  const actual = Buffer.from(given, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? userId : null;
}

export async function currentUser() {
  const userId = validSession((await cookies()).get(COOKIE)?.value);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, isPartner: true } }) as Promise<{ id: string; name: string; email: string; role: string; isPartner: boolean } | null>;
}

export async function isAuthenticated() {
  return (await currentUser()) !== null;
}

export function setSession(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE, sessionToken(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL });
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.delete(COOKIE);
  return response;
}

export async function protect() {
  const user = await currentUser();
  return user ? { user, response: null } : { user: null, response: NextResponse.json({ error: "Sesi berakhir. Silakan login kembali." }, { status: 401 }) };
}
