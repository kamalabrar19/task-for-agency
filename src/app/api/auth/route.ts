import { NextRequest, NextResponse } from "next/server";
import { clearSession, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { sameOrigin } from "@/lib/server";
import { tooManyAttempts } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (tooManyAttempts(`login:${ip}`)) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 10 menit." }, { status: 429 });
  const { email, password } = await request.json().catch(() => ({}));
  const user = typeof email === "string" && typeof password === "string"
    ? await db.user.findUnique({ where: { email: email.trim().toLowerCase() } }) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  return setSession(NextResponse.json({ ok: true }), user.id);
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  return clearSession(NextResponse.json({ ok: true }));
}
