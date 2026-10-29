// Pakai: npm run user:add -- email@domain.com "Nama" DEVELOPER|MARKETING|ADMIN "password-min-12"
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const [email, name, role, password] = process.argv.slice(2);
if (!email || !name || !["ADMIN", "MARKETING", "DEVELOPER"].includes(role) || !password || password.length < 12) {
  console.error('Pakai: npm run user:add -- email "Nama" ADMIN|MARKETING|DEVELOPER "password(min 12)"');
  process.exit(1);
}
const db = new PrismaClient();
const data = { name, role: role as "ADMIN" | "MARKETING" | "DEVELOPER", isPartner: role !== "ADMIN", passwordHash: hashPassword(password) };
db.user.upsert({ where: { email: email.toLowerCase() }, update: data, create: { email: email.toLowerCase(), ...data } })
  .then(() => console.log(`OK: ${email} (${role})`)).finally(() => db.$disconnect());
