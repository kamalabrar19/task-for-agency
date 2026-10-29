import { NextRequest, NextResponse } from "next/server";
import { clearSession, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  const { email, password } = await request.json();
  const user = typeof email === "string" && typeof password === "string"
    ? await db.user.findUnique({ where: { email: email.trim().toLowerCase() } }) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  return setSession(NextResponse.json({ ok: true }), user.id);
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  return clearSession(NextResponse.json({ ok: true }));
}
