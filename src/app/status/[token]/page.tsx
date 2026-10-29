import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { Check, Circle, Clock } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { db } from "@/lib/db";
import { HEALTH_LABEL, projectHealth } from "@/lib/health";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status proyek", robots: { index: false, follow: false } };

const STATUS_ID: Record<string, string> = { PLANNED: "Direncanakan", ACTIVE: "Sedang dikerjakan", REVIEW: "Tahap pemeriksaan", COMPLETED: "Selesai", CANCELLED: "Dibatalkan" };
const TONE: Record<string, string> = {
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ON_TRACK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  AT_RISK: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  LATE: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  NO_DEADLINE: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", ...o });

export default async function ClientStatus({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{43}$/.test(token)) notFound();
  const project = await db.project.findUnique({ where: { publicTokenHash: createHash("sha256").update(token).digest("hex") }, select: {
    name: true, status: true, deadline: true, createdAt: true, updatedAt: true, publicLinkExpiresAt: true, stagingUrl: true, liveUrl: true,
    client: { select: { name: true } },
    tasks: { select: { title: true, status: true }, orderBy: { createdAt: "asc" } },
    updates: { select: { id: true, message: true, author: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 8 },
  } }) as any;
  if (!project || !project.publicLinkExpiresAt || project.publicLinkExpiresAt < new Date()) notFound();

  const done = project.tasks.filter((t: any) => t.status === "DONE").length, total = project.tasks.length;
  const percent = total ? Math.round(done / total * 100) : 0;
  const health = projectHealth({ status: project.status, deadline: project.deadline, createdAt: project.createdAt, done, total });

  return <main className="mx-auto min-h-screen max-w-2xl px-5 py-10 pb-20">
    <div className="mb-12 flex items-center justify-between"><span className="flex items-center gap-2 font-bold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">B</span>{SITE.name}</span><ThemeToggle /></div>
    <p className="muted text-sm">Halo, {project.client.name}</p>
    <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{project.name}</h1>

    <section className="panel mt-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">Status: <strong>{STATUS_ID[project.status]}</strong></span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${TONE[health]}`}>{HEALTH_LABEL[health]}</span></div>
      <div className="mt-5 flex items-end justify-between"><span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{percent}%</span><span className="muted text-sm">{done} dari {total} tugas selesai</span></div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-200 dark:bg-[#1d2c24]"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} /></div>
      {project.deadline && <p className="muted mt-4 flex items-center gap-2 text-sm"><Clock size={14} />Target selesai: {fmt(project.deadline, { day: "numeric", month: "long", year: "numeric" })}</p>}
      {(project.stagingUrl || project.liveUrl) && <div className="mt-4 flex gap-2 text-sm">{project.stagingUrl && <a className="btn-ghost" href={project.stagingUrl} target="_blank" rel="noreferrer">Lihat versi uji</a>}{project.liveUrl && <a className="btn-ghost" href={project.liveUrl} target="_blank" rel="noreferrer">Buka website live</a>}</div>}
    </section>

    {project.updates.length > 0 && <>
      <h2 className="mb-3 mt-10 text-lg font-semibold">Kabar dari tim</h2>
      <div className="space-y-3">{project.updates.map((u: any) => <div key={u.id} className="panel p-4 text-sm"><p>{u.message}</p><p className="muted mt-2 text-xs">{u.author} · {fmt(u.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p></div>)}</div>
    </>}

    <h2 className="mb-3 mt-10 text-lg font-semibold">Milestone</h2>
    <ul className="space-y-2">{project.tasks.map((t: any, i: number) => <li key={i} className="panel flex items-center justify-between gap-4 p-4 text-sm">
      <span className="flex items-center gap-3">{t.status === "DONE" ? <Check size={16} className="shrink-0 text-emerald-600" /> : <Circle size={16} className="muted shrink-0" />}{t.title}</span>
      <span className="muted shrink-0 text-xs">{t.status === "DONE" ? "Selesai" : t.status === "REVIEW" ? "Pemeriksaan" : t.status === "IN_PROGRESS" ? "Dikerjakan" : "Antrean"}</span></li>)}</ul>
    {!total && <p className="muted text-sm">Daftar milestone akan muncul setelah pekerjaan dijadwalkan.</p>}

    <p className="muted mt-10 text-xs">Diperbarui {project.updatedAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}. Tautan ini hanya untuk melihat status, dan berlaku sampai {fmt(project.publicLinkExpiresAt, { day: "numeric", month: "long", year: "numeric" })}. Ada pertanyaan? Hubungi <a className="text-emerald-600 underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
  </main>;
}
