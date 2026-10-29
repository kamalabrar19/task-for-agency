import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientStatus({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[\w-]{43}$/.test(token)) notFound();
  const project = await db.project.findUnique({ where: { publicTokenHash: createHash("sha256").update(token).digest("hex") }, select: {
    name: true, status: true, deadline: true, updatedAt: true, client: { select: { name: true } },
    tasks: { select: { title: true, status: true }, orderBy: { createdAt: "asc" } }, publicLinkExpiresAt: true,
  } });
  if (!project || !project.publicLinkExpiresAt || project.publicLinkExpiresAt < new Date()) notFound();
  const done = project.tasks.filter((task: any) => task.status === "DONE").length;
  return <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-slate-100">
    <div className="mb-14 text-sm font-bold tracking-[.3em] text-violet-400">● &nbsp; AGENCY / STATUS</div>
    <p className="mb-2 text-sm text-slate-400">Halo, {project.client.name}</p>
    <h1 className="text-4xl font-semibold tracking-tight">{project.name}</h1>
    <p className="mt-3 text-slate-400">Pantau perkembangan proyek Anda secara langsung.</p>
    <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-7">
      <div className="flex justify-between text-sm"><span>Status: <strong className="text-violet-300">{project.status}</strong></span><span>{done}/{project.tasks.length} tugas selesai</span></div>
      <div className="mt-5 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-500" style={{ width: `${project.tasks.length ? Math.round(done / project.tasks.length * 100) : 0}%` }} /></div>
      {project.deadline && <p className="mt-5 text-sm text-slate-400">Target selesai: {(project.deadline as Date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })}</p>}
    </section>
    <h2 className="mt-10 mb-4 text-lg font-semibold">Milestone</h2>
    <div className="space-y-2">{project.tasks.map((task: any) => <div key={task.title} className="flex justify-between gap-4 rounded-xl border border-slate-800 p-4 text-sm"><span>{task.title}</span><span className="shrink-0 text-slate-400">{task.status === "DONE" ? "Selesai ✓" : task.status === "REVIEW" ? "Pemeriksaan" : "Dalam proses"}</span></div>)}</div>
    <p className="mt-10 text-xs text-slate-500">Diperbarui {(project.updatedAt as Date).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}. Tautan ini hanya untuk melihat status dan berlaku 90 hari.</p>
  </main>;
}
