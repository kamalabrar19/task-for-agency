import { NextRequest, NextResponse } from "next/server";

export function errorResponse(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: error instanceof Error && error.message.startsWith("VALIDATION:") ? error.message.slice(11) : "Terjadi kesalahan pada server." }, { status: error instanceof Error && error.message.startsWith("VALIDATION:") ? 400 : 500 });
}

export function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`VALIDATION:${field} wajib diisi`);
  return value.trim();
}

export function amount(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,15}$/.test(value) || BigInt(value) <= BigInt(0)) throw new Error("VALIDATION:Nominal harus bilangan bulat rupiah positif");
  return value;
}

export function optionalUrl(value: unknown) {
  if (!value) return null;
  if (typeof value !== "string") throw new Error("VALIDATION:URL tidak valid");
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch { throw new Error("VALIDATION:URL harus menggunakan http/https"); }
}

/** Tolak request lintas-origin; bandingkan host saja agar aman di balik reverse proxy HTTPS. */
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host")); } catch { return false; }
}

/** URL publik aplikasi untuk membuat link yang dibagikan ke klien. */
export function publicOrigin(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
}
