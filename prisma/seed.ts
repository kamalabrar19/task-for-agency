import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();
const production = process.env.NODE_ENV === "production";
const password = process.env.SEED_PASSWORD ?? (production ? "" : "agency123");
if (password.length < 12 && production) throw new Error("Set SEED_PASSWORD (min 12 karakter) sebelum seed di produksi");

async function main() {
  const team = [
    ["Admin", "ADMIN", false],
    ["Veby", "MARKETING", true],
    ["Dilo", "DEVELOPER", true],
    ["Natah", "DEVELOPER", true],
    ["Abe", "DEVELOPER", true],
  ] as const;
  for (const [name, role, isPartner] of team) {
    const email = `${name.toLowerCase()}@agency.local`;
    await db.user.upsert({
      where: { email },
      update: { name, role, isPartner, passwordHash: hashPassword(password) },
      create: { name, email, role, isPartner, passwordHash: hashPassword(password) },
    });
  }
  if (production || await db.client.count()) return; // data demo hanya untuk lokal
  const users = await db.user.findMany();
  const by = (n: string) => users.find((u) => u.name === n)!;
  const [veby, dilo, natah, abe] = [by("Veby"), by("Dilo"), by("Natah"), by("Abe")];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = 86400000;

  const c1 = await db.client.create({ data: { name: "Atelier Studio", contact: "hello@atelier.example", leadStage: "DEAL", dealAt: monthStart, ownerId: veby.id, notes: "Brand kreatif; landing page untuk kampanye baru." } });
  const c2 = await db.client.create({ data: { name: "Kopi Selatan", contact: "owner@kopi.example", leadStage: "DEAL", dealAt: monthStart, ownerId: veby.id, notes: "Toko kopi lokal; web store + WhatsApp." } });
  await db.client.createMany({ data: [
    { name: "Forma Digital", contact: "hello@forma.example", leadStage: "PROPOSAL_SENT", notes: "Landing page SaaS", ownerId: veby.id },
    { name: "Nusa Living", contact: "info@nusa.example", leadStage: "PROSPECT", notes: "Website company profile", ownerId: veby.id },
    { name: "Griya Medika", contact: "admin@griya.example", leadStage: "NEGOTIATION", notes: "Sistem antrean pasien custom", ownerId: veby.id },
  ] });

  const p1 = await db.project.create({ data: { name: "Atelier — Campaign Launch", clientId: c1.id, serviceType: "LANDING_PAGE", brief: "Landing page editorial, animasi ringan, formulir lead.", contractValue: "2800000", status: "ACTIVE", deadline: new Date(Date.now() + 12 * day), repoUrl: "https://github.com/", figmaUrl: "https://figma.com/" } });
  const p2 = await db.project.create({ data: { name: "Kopi Selatan — Web Store", clientId: c2.id, serviceType: "CUSTOM_SYSTEM", brief: "Katalog produk, halaman toko, integrasi WhatsApp.", contractValue: "1500000", status: "REVIEW", deadline: new Date(Date.now() + 5 * day) } });

  await db.task.createMany({ data: [
    { projectId: p1.id, assigneeId: dilo.id, title: "Setup design system & layout", status: "IN_PROGRESS", effortPoints: 5 },
    { projectId: p1.id, assigneeId: natah.id, title: "Integrasi formulir lead", status: "TODO", effortPoints: 3 },
    { projectId: p1.id, assigneeId: abe.id, title: "Konfigurasi deployment", status: "REVIEW", effortPoints: 2 },
    { projectId: p1.id, assigneeId: veby.id, title: "Copywriting & materi kampanye", status: "IN_PROGRESS", effortPoints: 3 },
    { projectId: p1.id, title: "QA & optimasi performa", status: "BACKLOG", effortPoints: 3 },
    { projectId: p2.id, assigneeId: abe.id, title: "API katalog produk", status: "IN_PROGRESS", effortPoints: 5 },
    { projectId: p2.id, assigneeId: natah.id, title: "Halaman produk responsif", status: "REVIEW", effortPoints: 3 },
    { projectId: p2.id, assigneeId: dilo.id, title: "Wireframe & komponen", status: "DONE", effortPoints: 2, completedAt: new Date() },
    { projectId: p2.id, assigneeId: natah.id, title: "Integrasi tombol WhatsApp", status: "DONE", effortPoints: 3, completedAt: new Date() },
  ] });
  await db.financialLedger.createMany({ data: [
    { projectId: p1.id, kind: "PAYMENT", amount: "1400000", occurredAt: monthStart, note: "DP 50%" },
    { projectId: p2.id, kind: "PAYMENT", amount: "750000", occurredAt: monthStart, note: "DP 50%" },
  ] });
  await db.expense.createMany({ data: [
    { projectId: p1.id, category: "DOMAIN", description: "Domain tahunan", amount: "180000", incurredAt: monthStart },
    { projectId: p2.id, category: "HOSTING", description: "Hosting bulan pertama", amount: "120000", incurredAt: monthStart },
  ] });

  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await db.kpi.createMany({ data: [
    { metric: "REVENUE", period, target: "10000000" },
    { metric: "PROJECTS_COMPLETED", period, target: "3" },
    { metric: "ON_TIME_RATE", period, target: "90" },
    { metric: "TASK_POINTS_DONE", period, ownerId: dilo.id, target: "15" },
    { metric: "TASK_POINTS_DONE", period, ownerId: natah.id, target: "15" },
    { metric: "TASK_POINTS_DONE", period, ownerId: abe.id, target: "15" },
    { metric: "LEADS_CREATED", period, ownerId: veby.id, target: "8" },
    { metric: "DEALS_WON", period, ownerId: veby.id, target: "3" },
  ] });
  await db.activityEvent.createMany({ data: [
    { kind: "project", message: "Deal baru: Atelier — Campaign Launch" },
    { kind: "task", message: "Konfigurasi deployment → Review" },
    { kind: "finance", message: "DP Kopi Selatan diterima" },
  ] });
}

main().finally(() => db.$disconnect());
