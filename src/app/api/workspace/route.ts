import { randomBytes, createHash } from "node:crypto";
import { LeadStage, Prisma, ProjectStatus, TaskStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { protect } from "@/lib/auth";
import { db } from "@/lib/db";
import { kpiActual, METRICS, KpiMetricName } from "@/lib/kpi";
import { hashPassword, verifyPassword } from "@/lib/password";
import { balanceWorkload, calculateProjectSplit, jakartaMonth } from "@/lib/finance";
import { amount, errorResponse, publicOrigin, sameOrigin, optionalUrl, requireText } from "@/lib/server";

const ADMIN_ONLY = ["project.update", "project.delete", "project.unlink", "task.edit", "lead.delete", "finance.delete", "update.delete", "project.create", "project.status", "project.link", "task.create", "task.delete", "finance.receipt", "finance.expense", "finance.payout", "kpi.set", "kpi.delete"];
const fail = (message: string): never => { throw new Error(`VALIDATION:${message}`); };
const validEnum = <T extends string>(value: unknown, values: readonly T[], label: string): T =>
  typeof value === "string" && values.includes(value as T) ? value as T : fail(`${label} tidak valid`);

export async function GET() {
  const { user: me, response: blocked } = await protect();
  if (blocked) return blocked;
  try {
    const [users, clients, projects, tasks, activities] = await Promise.all([
      db.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true, isPartner: true } }),
      db.client.findMany({ orderBy: { updatedAt: "desc" } }),
      db.project.findMany({ include: { client: true, expenses: true, ledger: true, payouts: { include: { member: true } }, tasks: true, updates: { orderBy: { createdAt: "desc" }, take: 20 } }, orderBy: { updatedAt: "desc" } }),
      db.task.findMany({ include: { project: { select: { name: true } }, assignee: { select: { name: true } } }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }),
      db.activityEvent.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
    ]);
    const month = jakartaMonth(new Date());
    const kpiRows = await db.kpi.findMany({ where: { period: month } }) as any[];
    const kpiInput = { month, jakartaMonth,
      ledger: (projects as any).flatMap((p: any) => p.ledger).map((l: any) => ({ kind: l.kind, amount: l.amount.toString(), occurredAt: l.occurredAt })),
      projects: projects as any, tasks: tasks as any, clients: clients as any };
    const kpiList = kpiRows.map((k) => ({ id: k.id, metric: k.metric, ownerId: k.ownerId, target: k.target.toString(), actual: kpiActual(k.metric as KpiMetricName, k.ownerId, kpiInput) }));
    const monthlyReceipts = (projects as any).flatMap((project: any) => project.ledger).filter((item: any) => jakartaMonth(item.occurredAt) === month);
    const monthlyExpenses = (projects as any).flatMap((project: any) => project.expenses).filter((item: any) => jakartaMonth(item.incurredAt) === month);
    const finances = calculateProjectSplit(monthlyReceipts.map((row: any) => ({ kind: row.kind, amount: row.amount.toString() })), monthlyExpenses.map((row: any) => ({ amount: row.amount.toString() })));
    const developers = (users as any).filter((user: any) => user.role === "DEVELOPER").map((user: any) => user.id);
    const workload = developers.length ? balanceWorkload(tasks as any, 1, developers) : null;
    return NextResponse.json({ me, metrics: METRICS, kpiList, users, clients, projects, tasks, activities, month, kpis: {
      activeProjects: (projects as any).filter((project: any) => ["ACTIVE", "REVIEW"].includes(project.status)).length,
      gross: finances.received.toString(), expenses: finances.operationalCosts.toString(),
      net: finances.netProfit.toString(), share: finances.individualShare.toString(),
    }, workload: workload?.currentPoints ?? {}, memberStats: Object.fromEntries((users as any).map((u: any) => [u.id, {
      points: kpiActual("TASK_POINTS_DONE", u.id, kpiInput),
      open: (tasks as any).filter((t: any) => t.assigneeId === u.id && t.status !== "DONE").length,
    }])) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  const { user: me, response: blocked } = await protect();
  if (blocked) return blocked;
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  try {
    const body = await request.json();
    const data = body.data ?? {};
    let result: unknown;
    const isAdmin = me!.role === "ADMIN";
    if (ADMIN_ONLY.includes(body.action) && !isAdmin) return NextResponse.json({ error: "Hanya admin yang dapat melakukan aksi ini" }, { status: 403 });
    switch (body.action) {
      case "lead.create": {
        if (!isAdmin && me!.role !== "MARKETING") fail("Hanya admin/marketing yang dapat mengelola prospek");
        result = await db.client.create({ data: { name: requireText(data.name, "Nama klien"), contact: requireText(data.contact, "Kontak"), notes: data.notes || null, ownerId: me!.id } });
        await db.activityEvent.create({ data: { kind: "lead", message: `Prospek baru: ${data.name}` } });
        break;
      }
      case "lead.move": {
        if (!isAdmin && me!.role !== "MARKETING") fail("Hanya admin/marketing yang dapat mengelola prospek");
        const stage = validEnum(data.stage, Object.values(LeadStage), "Tahap prospek");
        result = await db.client.update({ where: { id: requireText(data.id, "ID klien") }, data: { leadStage: stage, dealAt: stage === "DEAL" ? new Date() : null } });
        await db.activityEvent.create({ data: { kind: "lead", message: `${(result as { name: string }).name} dipindahkan ke ${stage.replaceAll("_", " ")}` } });
        break;
      }
      case "project.create": {
        const clientId = requireText(data.clientId, "Klien");
        const client = await db.client.findUnique({ where: { id: clientId } });
        if (!client) fail("Klien tidak ditemukan");
        const deadline = data.deadline ? new Date(`${data.deadline}T12:00:00+07:00`) : null;
        if (deadline && Number.isNaN(deadline.getTime())) fail("Deadline tidak valid");
        result = await db.project.create({ data: {
          clientId, name: requireText(data.name, "Nama proyek"), contractValue: amount(data.contractValue),
          brief: data.brief || null, deadline, status: "ACTIVE", serviceType: validEnum(data.serviceType ?? "LANDING_PAGE", ["LANDING_PAGE", "COMPANY_PROFILE", "CUSTOM_SYSTEM", "INTEGRATION"] as const, "Jenis layanan"),
          repoUrl: optionalUrl(data.repoUrl), figmaUrl: optionalUrl(data.figmaUrl),
          stagingUrl: optionalUrl(data.stagingUrl), liveUrl: optionalUrl(data.liveUrl),
        } });
        await db.client.update({ where: { id: clientId }, data: { leadStage: "DEAL", dealAt: (client as any).dealAt ?? new Date() } });
        await db.activityEvent.create({ data: { kind: "project", message: `Deal baru: ${data.name} · ${client.name}` } });
        break;
      }
      case "project.status": {
        const status = validEnum(data.status, Object.values(ProjectStatus), "Status proyek");
        const id = requireText(data.id, "ID proyek");
        const existing = await db.project.findUniqueOrThrow({ where: { id }, include: { payouts: true, tasks: true } }) as any;
        const openTasks = existing.tasks.filter((t: any) => t.status !== "DONE").length;
        if (status === "COMPLETED" && openTasks) fail(`Masih ada ${openTasks} tugas yang belum selesai`);
        if (existing.payouts.some((p: any) => p.status === "PAID") && status !== "COMPLETED") fail("Proyek dengan payout terbayar tidak dapat dibuka kembali");
        result = await db.project.update({ where: { id }, data: { status, completedAt: status === "COMPLETED" ? (existing.completedAt ?? new Date()) : null } });
        await db.activityEvent.create({ data: { kind: "project", message: `${existing.name} → ${status}` } });
        break;
      }
      case "project.link": {
        const id = requireText(data.id, "ID proyek");
        const token = randomBytes(32).toString("base64url");
        await db.project.update({ where: { id }, data: { publicTokenHash: createHash("sha256").update(token).digest("hex"), publicLinkExpiresAt: new Date(Date.now() + 90 * 86400000) } });
        result = { url: `${publicOrigin(request)}/status/${token}` };
        break;
      }
      case "task.create": {
        const projectId = requireText(data.projectId, "Proyek");
        const points = Number(data.effortPoints);
        if (!Number.isInteger(points) || points < 1 || points > 5) fail("Effort points harus 1–5");
        const status = validEnum(data.status ?? "BACKLOG", Object.values(TaskStatus), "Status tugas");
        if (!await db.project.findUnique({ where: { id: projectId } })) fail("Proyek tidak ditemukan");
        if (data.assigneeId) {
          const member = await db.user.findUnique({ where: { id: data.assigneeId } });
          if (!member || member.role === "ADMIN") fail("Penanggung jawab harus anggota tim");
        }
        result = await db.task.create({ data: {
          projectId, title: requireText(data.title, "Judul tugas"), description: data.description || null,
          effortPoints: points, status, completedAt: status === "DONE" ? new Date() : null, assigneeId: data.assigneeId || null,
          repoUrl: optionalUrl(data.repoUrl), figmaUrl: optionalUrl(data.figmaUrl), previewUrl: optionalUrl(data.previewUrl),
        } });
        await db.activityEvent.create({ data: { kind: "task", message: `Tugas baru: ${data.title}` } });
        break;
      }
      case "task.update": {
        const id = requireText(data.id, "ID tugas");
        const status = validEnum(data.status, Object.values(TaskStatus), "Status tugas");
        const ex: any = await db.task.findUnique({ where: { id } });
        if (!ex) fail("Tugas tidak ditemukan");
        if (!isAdmin && ex.assigneeId !== me!.id) return NextResponse.json({ error: "Anda hanya dapat mengubah tugas milik sendiri" }, { status: 403 });
        if (isAdmin && data.assigneeId) {
          const member = await db.user.findUnique({ where: { id: data.assigneeId } });
          if (!member || member.role === "ADMIN") fail("Penanggung jawab harus anggota tim");
        }
        result = await db.task.update({ where: { id }, data: { status, completedAt: status === "DONE" ? (ex.completedAt ?? new Date()) : null, ...(isAdmin ? { assigneeId: data.assigneeId || null } : {}) } });
        await db.activityEvent.create({ data: { kind: "task", message: `Tugas ${(result as { title: string }).title} → ${status.replaceAll("_", " ")}` } });
        break;
      }
      case "project.update": {
        const id = requireText(data.id, "ID proyek");
        const existing: any = await db.project.findUniqueOrThrow({ where: { id }, include: { payouts: true } });
        const deadline = data.deadline ? new Date(`${data.deadline}T12:00:00+07:00`) : null;
        if (deadline && Number.isNaN(deadline.getTime())) fail("Deadline tidak valid");
        const locked = existing.payouts.some((p: any) => p.status === "PAID");
        const value = data.contractValue ? amount(String(data.contractValue)) : existing.contractValue.toString();
        if (locked && value !== existing.contractValue.toString()) fail("Nilai kontrak terkunci setelah payout");
        result = await db.project.update({ where: { id }, data: {
          name: requireText(data.name, "Nama proyek"), brief: data.brief || null, deadline, contractValue: value,
          serviceType: validEnum(data.serviceType, ["LANDING_PAGE", "COMPANY_PROFILE", "CUSTOM_SYSTEM", "INTEGRATION"] as const, "Jenis layanan"),
          repoUrl: optionalUrl(data.repoUrl), figmaUrl: optionalUrl(data.figmaUrl), stagingUrl: optionalUrl(data.stagingUrl), liveUrl: optionalUrl(data.liveUrl),
        } });
        await db.activityEvent.create({ data: { kind: "project", message: `Proyek diperbarui: ${data.name}` } });
        break;
      }
      case "project.delete": {
        const id = requireText(data.id, "ID proyek");
        const existing: any = await db.project.findUniqueOrThrow({ where: { id }, include: { payouts: true } });
        if (existing.payouts.some((p: any) => p.status === "PAID")) fail("Proyek dengan payout terbayar tidak dapat dihapus");
        await db.$transaction([
          db.task.deleteMany({ where: { projectId: id } }), db.expense.deleteMany({ where: { projectId: id } }),
          db.financialLedger.deleteMany({ where: { projectId: id } }), db.payout.deleteMany({ where: { projectId: id } }),
          db.projectUpdate.deleteMany({ where: { projectId: id } }), db.project.delete({ where: { id } }),
        ]);
        await db.activityEvent.create({ data: { kind: "project", message: `Proyek dihapus: ${existing.name}` } });
        result = { deleted: true };
        break;
      }
      case "project.unlink": {
        await db.project.update({ where: { id: requireText(data.id, "ID proyek") }, data: { publicTokenHash: null, publicLinkExpiresAt: null } });
        result = { revoked: true };
        break;
      }
      case "task.edit": {
        const id = requireText(data.id, "ID tugas");
        const points = Number(data.effortPoints);
        if (!Number.isInteger(points) || points < 1 || points > 5) fail("Effort points harus 1–5");
        result = await db.task.update({ where: { id }, data: {
          title: requireText(data.title, "Judul tugas"), description: data.description || null, effortPoints: points,
          repoUrl: optionalUrl(data.repoUrl), figmaUrl: optionalUrl(data.figmaUrl), previewUrl: optionalUrl(data.previewUrl),
        } });
        break;
      }
      case "lead.update": {
        if (!isAdmin && me!.role !== "MARKETING") fail("Hanya admin/marketing yang dapat mengelola prospek");
        result = await db.client.update({ where: { id: requireText(data.id, "ID klien") }, data: { name: requireText(data.name, "Nama klien"), contact: requireText(data.contact, "Kontak"), notes: data.notes || null } });
        break;
      }
      case "lead.delete": {
        const id = requireText(data.id, "ID klien");
        if (await db.project.count({ where: { clientId: id } })) fail("Klien masih memiliki proyek; hapus proyeknya dulu");
        await db.client.delete({ where: { id } });
        result = { deleted: true };
        break;
      }
      case "finance.delete": {
        const kind = validEnum(data.kind, ["receipt", "expense"] as const, "Jenis catatan");
        const id = requireText(data.id, "ID catatan");
        const row: any = kind === "receipt" ? await db.financialLedger.findUnique({ where: { id } }) : await db.expense.findUnique({ where: { id } });
        if (!row) fail("Catatan tidak ditemukan");
        if (await db.payout.count({ where: { projectId: row.projectId, status: "PAID" } })) fail("Keuangan terkunci setelah payout");
        if (kind === "receipt") await db.financialLedger.delete({ where: { id } }); else await db.expense.delete({ where: { id } });
        await db.activityEvent.create({ data: { kind: "finance", message: `Catatan ${kind === "receipt" ? "pembayaran" : "biaya"} dihapus` } });
        result = { deleted: true };
        break;
      }
      case "update.create": {
        const projectId = requireText(data.projectId, "Proyek");
        if (!await db.project.findUnique({ where: { id: projectId } })) fail("Proyek tidak ditemukan");
        const message = requireText(data.message, "Pesan update");
        if (message.length > 500) fail("Pesan update maksimal 500 karakter");
        result = await db.projectUpdate.create({ data: { projectId, message, author: me!.name } });
        break;
      }
      case "update.delete": {
        await db.projectUpdate.delete({ where: { id: requireText(data.id, "ID update") } });
        result = { deleted: true };
        break;
      }
      case "task.delete": {
        await db.task.delete({ where: { id: requireText(data.id, "ID tugas") } });
        result = { deleted: true };
        break;
      }
      case "kpi.set": {
        const metric = validEnum(data.metric, Object.keys(METRICS) as KpiMetricName[], "Metrik");
        const period = typeof data.period === "string" && /^\d{4}-\d{2}$/.test(data.period) ? data.period : jakartaMonth(new Date());
        const target = amount(String(data.target));
        const ownerId = METRICS[metric].scope === "member" ? (data.ownerId || null) : null;
        const existingKpi = await db.kpi.findFirst({ where: { metric, period, ownerId } });
        result = existingKpi ? await db.kpi.update({ where: { id: existingKpi.id }, data: { target } }) : await db.kpi.create({ data: { metric, period, ownerId, target } });
        await db.activityEvent.create({ data: { kind: "kpi", message: `Target KPI ${METRICS[metric].label} diatur: ${target}` } });
        break;
      }
      case "kpi.delete": {
        await db.kpi.delete({ where: { id: requireText(data.id, "ID KPI") } });
        result = { deleted: true };
        break;
      }
      case "account.password": {
        const user = await db.user.findUniqueOrThrow({ where: { id: me!.id } });
        if (!verifyPassword(String(data.current ?? ""), user.passwordHash)) fail("Password saat ini salah");
        const next = requireText(data.next, "Password baru");
        if (next.length < 8) fail("Password baru minimal 8 karakter");
        await db.user.update({ where: { id: me!.id }, data: { passwordHash: hashPassword(next) } });
        result = { changed: true };
        break;
      }
      case "finance.receipt":
      case "finance.expense": {
        const projectId = requireText(data.projectId, "Proyek");
        const value = amount(data.amount);
        result = await db.$transaction(async (tx: any) => {
          const project = await tx.project.findUnique({ where: { id: projectId }, include: { payouts: true } });
          if (!project) fail("Proyek tidak ditemukan");
          if ((project as any).payouts.some((p: any) => p.status === "PAID")) fail("Keuangan terkunci setelah payout; lakukan koreksi terpisah");
          if (body.action === "finance.receipt" && (data.kind ?? "PAYMENT") === "PAYMENT") {
            const paid = ((await tx.financialLedger.findMany({ where: { projectId } })) as any[]).reduce((n, r) => n + (r.kind === "PAYMENT" ? BigInt(1) : -BigInt(1)) * BigInt(r.amount.toString()), BigInt(0));
            if (paid + BigInt(value) > BigInt((project as any).contractValue.toString())) fail("Total pembayaran melebihi nilai kontrak");
          }
          if (body.action === "finance.receipt") return tx.financialLedger.create({ data: { projectId, amount: value, kind: validEnum(data.kind ?? "PAYMENT", ["PAYMENT", "REFUND"] as const, "Jenis penerimaan"), occurredAt: new Date(), note: data.note || null } });
          return tx.expense.create({ data: { projectId, amount: value, category: requireText(data.category, "Kategori"), description: requireText(data.description, "Deskripsi"), incurredAt: new Date() } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        await db.activityEvent.create({ data: { kind: "finance", message: `${body.action === "finance.receipt" ? "Pembayaran" : "Biaya operasional"} dicatat · ${value} IDR` } });
        break;
      }
      case "finance.payout": {
        const projectId = requireText(data.projectId, "Proyek");
        const memberId = requireText(data.memberId, "Anggota");
        result = await db.$transaction(async (tx: any) => {
          const project: any = await tx.project.findUniqueOrThrow({ where: { id: projectId }, include: { ledger: true, expenses: true } });
          const members = await tx.user.findMany({ where: { isPartner: true } });
          if ((members as any).length !== 4 || !(members as any).some((m: any) => m.id === memberId)) fail("Pembagian membutuhkan tepat 4 partner aktif");
          if (project.status !== "COMPLETED") fail("Selesaikan proyek sebelum payout");
          const split = calculateProjectSplit((project.ledger as any).map((r: any) => ({ kind: r.kind, amount: r.amount.toString() })), (project.expenses as any).map((e: any) => ({ amount: e.amount.toString() })));
          if (split.received !== BigInt(project.contractValue.toString())) fail("Penerimaan bersih harus sama dengan nilai kontrak sebelum payout");
          if (split.individualShare <= BigInt(0)) fail("Tidak ada laba yang dapat dibagikan");
          const previous = await tx.payout.findUnique({ where: { projectId_memberId: { projectId, memberId } } });
          if (previous?.status === "PAID") fail("Anggota ini sudah menerima payout");
          return tx.payout.upsert({ where: { projectId_memberId: { projectId, memberId } }, create: { projectId, memberId, amount: split.individualShare.toString(), status: "PAID", paidAt: new Date() }, update: { amount: split.individualShare.toString(), status: "PAID", paidAt: new Date() } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        await db.activityEvent.create({ data: { kind: "finance", message: `Payout ${(result as { amount: { toString(): string } }).amount.toString()} IDR telah dicatat` } });
        break;
      }
      default: fail("Aksi tidak dikenal");
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) { return errorResponse(error); }
}
