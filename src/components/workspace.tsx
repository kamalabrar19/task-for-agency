"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Briefcase, Check, KanbanSquare, LayoutDashboard, Link2, LogOut, Moon, Plus, Sun, Target, Users, Wallet, X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = any;

const TASK_COLS: [string, string][] = [["BACKLOG", "Backlog"], ["TODO", "To Do"], ["IN_PROGRESS", "Dikerjakan"], ["REVIEW", "Review"], ["DONE", "Selesai"]];
const LEAD_COLS: [string, string][] = [["PROSPECT", "Prospek"], ["NEGOTIATION", "Negosiasi"], ["PROPOSAL_SENT", "Proposal"], ["DEAL", "Deal"], ["LOST", "Batal"]];
const PROJECT_STATUS: [string, string][] = [["PLANNED", "Direncanakan"], ["ACTIVE", "Berjalan"], ["REVIEW", "Review"], ["COMPLETED", "Selesai"], ["CANCELLED", "Dibatalkan"]];
const SERVICES: Record<string, string> = { LANDING_PAGE: "Landing Page", COMPANY_PROFILE: "Company Profile", CUSTOM_SYSTEM: "Sistem Web Custom", INTEGRATION: "Integrasi & Maintenance" };
const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", MARKETING: "Marketing Strategist", DEVELOPER: "Developer" };
const rupiah = (v: string | number | bigint) => `Rp ${BigInt(v).toLocaleString("id-ID")}`;
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }) : "—";
const pct = (a: number, t: number) => t > 0 ? Math.min(100, Math.round(a / t * 100)) : 0;

type Tab = "dashboard" | "board" | "projects" | "leads" | "kpi" | "team" | "finance";

export default function Workspace() {
  const [data, setData] = useState<Data>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dark, setDark] = useState(true);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/workspace");
    if (r.status === 401) { window.location.href = "/login"; return; }
    setData(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  /** Kirim aksi ke API; true bila sukses. */
  const act = useCallback(async (action: string, payload: Record<string, unknown>, ok?: string) => {
    const r = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data: payload }) });
    const body = await r.json();
    if (!r.ok) { flash(body.error ?? "Gagal"); return null; }
    if (ok) flash(ok);
    await load();
    return body.result ?? true;
  }, [load]);

  if (!data) return <main className="flex min-h-screen items-center justify-center muted">Memuat workspace…</main>;
  const me = data.me, isAdmin = me.role === "ADMIN";
  const nav: [Tab, string, ReactNode, boolean][] = [
    ["dashboard", "Dashboard", <LayoutDashboard key="d" size={17} />, true],
    ["board", "Papan Tugas", <KanbanSquare key="b" size={17} />, true],
    ["projects", "Proyek", <Briefcase key="p" size={17} />, true],
    ["leads", "Prospek", <Users key="l" size={17} />, isAdmin || me.role === "MARKETING"],
    ["kpi", "KPI", <Target key="k" size={17} />, true],
    ["team", "Tim", <BarChart3 key="t" size={17} />, true],
    ["finance", "Keuangan", <Wallet key="f" size={17} />, isAdmin],
  ];
  const props = { data, act, me, isAdmin, flash };

  return <div className="flex min-h-screen flex-col md:flex-row">
    <aside className="border-b border-slate-200 p-4 dark:border-[#272936] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center gap-3 text-sm font-bold tracking-[.2em] md:mb-8"><span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-lg text-white">✳</span>AGENCY</div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {nav.filter(n => n[3]).map(([id, label, icon]) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${tab === id ? "bg-violet-600 text-white" : "muted hover:bg-slate-100 dark:hover:bg-[#1b1d29]"}`}>{icon}{label}</button>)}
      </nav>
      <div className="mt-4 hidden border-t border-slate-200 pt-4 dark:border-[#272936] md:absolute md:bottom-4 md:left-4 md:right-4 md:mt-0 md:block">
        <p className="text-sm font-semibold">{me.name}</p><p className="muted text-xs">{ROLE_LABEL[me.role]}</p>
        <div className="mt-3 flex gap-2">
          <button className="btn-ghost" onClick={() => setDark(!dark)} aria-label="Tema">{dark ? <Sun size={15} /> : <Moon size={15} />}</button>
          <button className="btn-ghost flex-1" onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); window.location.href = "/login"; }}><LogOut size={15} />Keluar</button>
        </div>
      </div>
    </aside>
    <main className="min-w-0 flex-1 p-4 md:p-8">
      {tab === "dashboard" && <Dashboard {...props} go={setTab} />}
      {tab === "board" && <Board {...props} />}
      {tab === "projects" && <Projects {...props} />}
      {tab === "leads" && <Leads {...props} />}
      {tab === "kpi" && <Kpis {...props} />}
      {tab === "team" && <Team {...props} />}
      {tab === "finance" && <Finance {...props} />}
    </main>
    {toast && <div role="status" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-violet-600">{toast}</div>}
  </div>;
}

/* ---------- shared ---------- */
function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="muted mt-1 text-sm">{sub}</p>}</div>{children}</div>;
}
function Bar({ value, tone = "violet" }: { value: number; tone?: string }) {
  const color = value >= 100 ? "bg-emerald-500" : tone === "violet" ? "bg-violet-500" : "bg-sky-500";
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#272936]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} /></div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>{children}
    </div></div>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-semibold muted">{label}<div className="mt-1.5 text-sm font-normal">{children}</div></label>;
}
const form = (fn: (v: Record<string, string>) => Promise<unknown>) => async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  await fn(v);
};
function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return <div className="panel p-5"><p className="muted text-xs font-semibold uppercase tracking-wider">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p>{sub && <p className="muted mt-1 text-xs">{sub}</p>}</div>;
}
function KpiRow({ k, data }: { k: any; data: Data }) {
  const m = data.metrics[k.metric];
  const a = Number(k.actual), t = Number(k.target), p = pct(a, t);
  const fmt = (n: number) => m.unit === "Rp" ? rupiah(n) : `${n.toLocaleString("id-ID")}${m.unit === "%" ? "%" : ` ${m.unit}`}`;
  const owner = k.ownerId ? data.users.find((u: any) => u.id === k.ownerId)?.name : null;
  return <div><div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{m.label}{owner && <span className="muted"> · {owner}</span>}</span><span className="muted text-xs">{fmt(a)} / {fmt(t)} · <strong className="text-inherit">{p}%</strong></span></div><Bar value={p} /></div>;
}

/* ---------- dashboard ---------- */
function Dashboard({ data, me, go }: any) {
  const mine = data.tasks.filter((t: any) => t.assigneeId === me.id && t.status !== "DONE");
  const myKpis = data.kpiList.filter((k: any) => k.ownerId === me.id);
  const teamKpis = data.kpiList.filter((k: any) => !k.ownerId);
  return <>
    <Header title={`Halo, ${me.name}`} sub={`Ringkasan bulan ${data.month}`} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Proyek aktif" value={data.kpis.activeProjects} />
      <Stat label="Pendapatan bulan ini" value={rupiah(data.kpis.gross)} />
      <Stat label="Laba bersih" value={rupiah(data.kpis.net)} sub={`Bagian per partner ${rupiah(data.kpis.share)}`} />
      <Stat label="Tugas saya" value={mine.length} sub="belum selesai" />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="panel p-6"><h2 className="mb-4 font-semibold">KPI Tim</h2>
        <div className="space-y-5">{teamKpis.map((k: any) => <KpiRow key={k.id} k={k} data={data} />)}{!teamKpis.length && <p className="muted text-sm">Belum ada target KPI tim.</p>}</div>
        <button className="btn-ghost mt-5" onClick={() => go("kpi")}>Lihat semua KPI</button></section>
      <section className="panel p-6"><h2 className="mb-4 font-semibold">KPI Saya</h2>
        <div className="space-y-5">{myKpis.map((k: any) => <KpiRow key={k.id} k={k} data={data} />)}{!myKpis.length && <p className="muted text-sm">Admin belum menetapkan KPI personal untuk Anda.</p>}</div></section>
      <section className="panel p-6"><h2 className="mb-4 font-semibold">Jobdesk Saya</h2>
        <ul className="space-y-2">{mine.map((t: any) => <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-[#272936]"><span><strong>{t.title}</strong><span className="muted block text-xs">{t.project.name}</span></span><span className="muted shrink-0 text-xs">{TASK_COLS.find(c => c[0] === t.status)![1]} · {t.effortPoints} poin</span></li>)}{!mine.length && <p className="muted text-sm">Tidak ada tugas aktif. 🎉</p>}</ul></section>
      <section className="panel p-6"><h2 className="mb-4 font-semibold">Aktivitas Terbaru</h2>
        <ul className="space-y-3 text-sm">{data.activities.map((a: any) => <li key={a.id} className="flex justify-between gap-3"><span>{a.message}</span><span className="muted shrink-0 text-xs">{new Date(a.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>)}</ul></section>
    </div></>;
}

/* ---------- board ---------- */
function Board({ data, act, me, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [only, setOnly] = useState(false);
  const members = data.users.filter((u: any) => u.role !== "ADMIN");
  const tasks = data.tasks.filter((t: any) => !only || t.assigneeId === me.id);
  return <>
    <Header title="Papan Tugas" sub={isAdmin ? "Berikan jobdesk dan pantau progres tim." : "Perbarui status tugas yang ditugaskan kepada Anda."}>
      <div className="flex gap-2"><button className="btn-ghost" onClick={() => setOnly(!only)}>{only ? "Semua tugas" : "Tugas saya"}</button>{isAdmin && <button className="btn" onClick={() => setOpen(true)}><Plus size={16} />Jobdesk baru</button>}</div>
    </Header>
    <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-5">
      {TASK_COLS.map(([status, label]) => { const col = tasks.filter((t: any) => t.status === status); return <div key={status} className="min-w-[210px]">
        <p className="muted mb-3 text-xs font-bold uppercase tracking-wider">{label} · {col.length}</p>
        <div className="space-y-3">{col.map((t: any) => { const editable = isAdmin || t.assigneeId === me.id; return <div key={t.id} className="panel p-4 text-sm">
          <p className="font-semibold">{t.title}</p><p className="muted mt-1 text-xs">{t.project.name}</p>
          {t.description && <p className="muted mt-2 text-xs">{t.description}</p>}
          <div className="mt-3 flex items-center justify-between text-xs"><span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{t.effortPoints} poin</span><span className="muted">{t.assignee?.name ?? "Belum ditugaskan"}</span></div>
          {editable && <div className="mt-3 flex gap-2">
            <select aria-label="Status" className="field !py-1.5 text-xs" value={t.status} onChange={e => act("task.update", { id: t.id, status: e.target.value, assigneeId: t.assigneeId })}>{TASK_COLS.map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select>
            {isAdmin && <select aria-label="Penanggung jawab" className="field !py-1.5 text-xs" value={t.assigneeId ?? ""} onChange={e => act("task.update", { id: t.id, status: t.status, assigneeId: e.target.value })}><option value="">—</option>{members.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
          </div>}
          {isAdmin && <button className="muted mt-2 text-xs underline" onClick={() => confirm("Hapus tugas ini?") && act("task.delete", { id: t.id }, "Tugas dihapus")}>Hapus</button>}
        </div>; })}</div></div>; })}
    </div>
    {open && <Modal title="Jobdesk baru" onClose={() => setOpen(false)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("task.create", v, "Jobdesk dibuat")) setOpen(false); })}>
        <Field label="JUDUL"><input name="title" required className="field" /></Field>
        <Field label="DESKRIPSI"><textarea name="description" rows={2} className="field" /></Field>
        <Field label="PROYEK"><select name="projectId" required className="field">{data.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PENANGGUNG JAWAB"><select name="assigneeId" className="field"><option value="">Belum ditugaskan</option>{members.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role]})</option>)}</select></Field>
          <Field label="EFFORT (1–5)"><input name="effortPoints" type="number" min={1} max={5} defaultValue={3} required className="field" /></Field>
        </div>
        <Field label="LINK REPO / FIGMA (opsional)"><input name="repoUrl" type="url" placeholder="https://" className="field" /></Field>
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}

/* ---------- projects ---------- */
function Projects({ data, act, isAdmin, flash }: any) {
  const [open, setOpen] = useState(false);
  return <>
    <Header title="Proyek" sub="Setiap proyek terhubung ke klien, tugas, dan keuangan.">{isAdmin && <button className="btn" onClick={() => setOpen(true)}><Plus size={16} />Proyek baru</button>}</Header>
    <div className="grid gap-4 lg:grid-cols-2">{data.projects.map((p: any) => { const done = p.tasks.filter((t: any) => t.status === "DONE").length, progress = pct(done, p.tasks.length); return <div key={p.id} className="panel p-6">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{p.name}</h3><p className="muted text-sm">{p.client.name} · {SERVICES[p.serviceType]}</p></div>
        {isAdmin ? <select aria-label="Status proyek" className="field !w-auto !py-1.5 text-xs" value={p.status} onChange={e => act("project.status", { id: p.id, status: e.target.value }, "Status diperbarui")}>{PROJECT_STATUS.map(s => <option key={s[0]} value={s[0]}>{s[1]}</option>)}</select> : <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{PROJECT_STATUS.find(s => s[0] === p.status)![1]}</span>}</div>
      {p.brief && <p className="muted mt-3 text-sm">{p.brief}</p>}
      <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span className="muted">{done}/{p.tasks.length} tugas selesai</span><strong>{progress}%</strong></div><Bar value={progress} /></div>
      <div className="muted mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><span>Tenggat: {fmtDate(p.deadline)}</span>{isAdmin && <span>Nilai kontrak: {rupiah(p.contractValue)}</span>}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">{[["Repo", p.repoUrl], ["Figma", p.figmaUrl], ["Staging", p.stagingUrl], ["Live", p.liveUrl]].filter(l => l[1]).map(([l, u]) => <a key={l} href={u!} target="_blank" rel="noreferrer" className="btn-ghost !py-1">{l}</a>)}
        {isAdmin && <button className="btn-ghost !py-1" onClick={async () => { const r: any = await act("project.link", { id: p.id }); if (r?.url) { try { await navigator.clipboard.writeText(r.url); } catch { /* clipboard blocked */ } flash(`Link klien disalin: ${r.url}`); } }}><Link2 size={13} />Link status klien</button>}</div>
    </div>; })}</div>
    {open && <Modal title="Proyek baru" onClose={() => setOpen(false)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("project.create", v, "Proyek dibuat")) setOpen(false); })}>
        <Field label="NAMA PROYEK"><input name="name" required className="field" /></Field>
        <Field label="KLIEN"><select name="clientId" required className="field">{data.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="LAYANAN"><select name="serviceType" className="field">{Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="NILAI KONTRAK (Rp)"><input name="contractValue" inputMode="numeric" pattern="\d{1,15}" required className="field" placeholder="3000000" /></Field>
        </div>
        <Field label="TENGGAT"><input name="deadline" type="date" className="field" /></Field>
        <Field label="BRIEF"><textarea name="brief" rows={3} className="field" /></Field>
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}

/* ---------- leads ---------- */
function Leads({ data, act }: any) {
  const [open, setOpen] = useState(false);
  return <>
    <Header title="Prospek" sub="Pipeline penjualan dari prospek sampai deal."><button className="btn" onClick={() => setOpen(true)}><Plus size={16} />Prospek baru</button></Header>
    <div className="grid gap-4 overflow-x-auto md:grid-cols-5">{LEAD_COLS.map(([stage, label]) => { const col = data.clients.filter((c: any) => c.leadStage === stage); return <div key={stage} className="min-w-[200px]">
      <p className="muted mb-3 text-xs font-bold uppercase tracking-wider">{label} · {col.length}</p>
      <div className="space-y-3">{col.map((c: any) => <div key={c.id} className="panel p-4 text-sm"><p className="font-semibold">{c.name}</p><p className="muted text-xs">{c.contact}</p>{c.notes && <p className="muted mt-2 text-xs">{c.notes}</p>}
        <select aria-label="Tahap" className="field mt-3 !py-1.5 text-xs" value={c.leadStage} onChange={e => act("lead.move", { id: c.id, stage: e.target.value }, "Tahap dipindahkan")}>{LEAD_COLS.map(l => <option key={l[0]} value={l[0]}>{l[1]}</option>)}</select></div>)}</div></div>; })}</div>
    {open && <Modal title="Prospek baru" onClose={() => setOpen(false)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("lead.create", v, "Prospek ditambahkan")) setOpen(false); })}>
        <Field label="NAMA KLIEN"><input name="name" required className="field" /></Field>
        <Field label="KONTAK"><input name="contact" required className="field" /></Field>
        <Field label="CATATAN"><textarea name="notes" rows={3} className="field" /></Field>
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}

/* ---------- KPI ---------- */
function Kpis({ data, act, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState("REVENUE");
  const members = data.users.filter((u: any) => u.role !== "ADMIN");
  const team = data.kpiList.filter((k: any) => !k.ownerId);
  const overall = data.kpiList.length ? Math.round(data.kpiList.reduce((s: number, k: any) => s + pct(Number(k.actual), Number(k.target)), 0) / data.kpiList.length) : 0;
  return <>
    <Header title="KPI" sub={`Target dan pencapaian bulan ${data.month} (dihitung otomatis dari data proyek, tugas, dan prospek).`}>{isAdmin && <button className="btn" onClick={() => setOpen(true)}><Plus size={16} />Atur target</button>}</Header>
    <section className="panel mb-6 p-6"><div className="mb-3 flex items-baseline justify-between"><h2 className="font-semibold">Pencapaian keseluruhan</h2><span className="text-2xl font-semibold">{overall}%</span></div><Bar value={overall} /></section>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-6"><h2 className="mb-4 font-semibold">Tim</h2><div className="space-y-5">{team.map((k: any) => <div key={k.id} className="flex items-end gap-3"><div className="flex-1"><KpiRow k={k} data={data} /></div>{isAdmin && <button aria-label="Hapus KPI" className="muted" onClick={() => act("kpi.delete", { id: k.id })}><X size={15} /></button>}</div>)}{!team.length && <p className="muted text-sm">Belum ada target.</p>}</div></section>
      {members.map((u: any) => { const list = data.kpiList.filter((k: any) => k.ownerId === u.id); return <section key={u.id} className="panel p-6"><h2 className="mb-1 font-semibold">{u.name}</h2><p className="muted mb-4 text-xs">{ROLE_LABEL[u.role]}</p>
        <div className="space-y-5">{list.map((k: any) => <div key={k.id} className="flex items-end gap-3"><div className="flex-1"><KpiRow k={k} data={data} /></div>{isAdmin && <button aria-label="Hapus KPI" className="muted" onClick={() => act("kpi.delete", { id: k.id })}><X size={15} /></button>}</div>)}{!list.length && <p className="muted text-sm">Belum ada target.</p>}</div></section>; })}
    </div>
    {open && <Modal title="Atur target KPI" onClose={() => setOpen(false)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("kpi.set", { ...v, period: data.month }, "Target disimpan")) setOpen(false); })}>
        <Field label="METRIK"><select name="metric" className="field" value={metric} onChange={e => setMetric(e.target.value)}>{Object.entries(data.metrics).map(([k, m]: any) => <option key={k} value={k}>{m.label} ({m.scope === "team" ? "tim" : "per anggota"})</option>)}</select></Field>
        <p className="muted text-xs">{data.metrics[metric].hint}</p>
        {data.metrics[metric].scope === "member" && <Field label="ANGGOTA"><select name="ownerId" required className="field">{members.filter((u: any) => metric === "LEADS_CREATED" || metric === "DEALS_WON" ? u.role === "MARKETING" : u.role === "DEVELOPER").map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
        <Field label={`TARGET (${data.metrics[metric].unit})`}><input name="target" inputMode="numeric" pattern="\d{1,15}" required className="field" /></Field>
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}

/* ---------- team ---------- */
function Team({ data }: any) {
  const members = data.users.filter((u: any) => u.role !== "ADMIN");
  const max = Math.max(1, ...members.map((u: any) => data.memberStats[u.id].open));
  return <>
    <Header title="Tim" sub="Beban kerja dan kontribusi tiap anggota bulan ini." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{members.map((u: any) => { const s = data.memberStats[u.id]; return <div key={u.id} className="panel p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-violet-600 text-lg font-semibold text-white">{u.name[0]}</div>
      <h3 className="mt-4 font-semibold">{u.name}</h3><p className="muted text-xs">{ROLE_LABEL[u.role]}</p>
      <dl className="mt-4 space-y-3 text-sm"><div><dt className="muted mb-1 flex justify-between text-xs"><span>Tugas terbuka</span><span>{s.open}</span></dt><dd><Bar value={pct(s.open, max)} tone="sky" /></dd></div>
        <div className="flex justify-between"><dt className="muted">Poin selesai</dt><dd className="font-semibold">{s.points}</dd></div>
        {data.workload[u.id] !== undefined && <div className="flex justify-between"><dt className="muted">Beban aktif</dt><dd className="font-semibold">{data.workload[u.id]} poin</dd></div>}</dl></div>; })}</div></>;
}

/* ---------- finance ---------- */
function Finance({ data, act }: any) {
  const [modal, setModal] = useState<{ kind: "receipt" | "expense"; projectId: string } | null>(null);
  const partners = data.users.filter((u: any) => u.isPartner);
  return <>
    <Header title="Keuangan" sub="Pembayaran, biaya operasional, dan pembagian laba rata ke 4 partner." />
    <div className="mb-6 grid gap-4 sm:grid-cols-4"><Stat label="Pendapatan" value={rupiah(data.kpis.gross)} /><Stat label="Biaya" value={rupiah(data.kpis.expenses)} /><Stat label="Laba bersih" value={rupiah(data.kpis.net)} /><Stat label="Per partner" value={rupiah(data.kpis.share)} /></div>
    <div className="space-y-4">{data.projects.map((p: any) => {
      const received = p.ledger.reduce((s: bigint, l: any) => s + (l.kind === "PAYMENT" ? 1n : -1n) * BigInt(l.amount), 0n);
      const cost = p.expenses.reduce((s: bigint, e: any) => s + BigInt(e.amount), 0n);
      const locked = p.payouts.some((x: any) => x.status === "PAID");
      return <section key={p.id} className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{p.name}</h3><p className="muted text-xs">Kontrak {rupiah(p.contractValue)} · Diterima {rupiah(received)} · Biaya {rupiah(cost)}</p></div>
          <div className="flex gap-2"><button className="btn-ghost" disabled={locked} onClick={() => setModal({ kind: "receipt", projectId: p.id })}>+ Pembayaran</button><button className="btn-ghost" disabled={locked} onClick={() => setModal({ kind: "expense", projectId: p.id })}>+ Biaya</button></div></div>
        <div className="mt-4"><Bar value={pct(Number(received), Number(p.contractValue))} tone="sky" /></div>
        {p.status === "COMPLETED" && <div className="mt-4 flex flex-wrap gap-2">{partners.map((m: any) => { const paid = p.payouts.find((x: any) => x.memberId === m.id && x.status === "PAID"); return paid
          ? <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><Check size={13} />{m.name} {rupiah(paid.amount)}</span>
          : <button key={m.id} className="btn-ghost !py-1 text-xs" onClick={() => confirm(`Catat payout untuk ${m.name}?`) && act("finance.payout", { projectId: p.id, memberId: m.id }, "Payout dicatat")}>Bayar {m.name}</button>; })}</div>}
      </section>; })}</div>
    {modal && <Modal title={modal.kind === "receipt" ? "Catat pembayaran" : "Catat biaya"} onClose={() => setModal(null)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act(`finance.${modal.kind}`, { ...v, projectId: modal.projectId }, "Tersimpan")) setModal(null); })}>
        <Field label="NOMINAL (Rp)"><input name="amount" inputMode="numeric" pattern="\d{1,15}" required className="field" /></Field>
        {modal.kind === "receipt" ? <><Field label="JENIS"><select name="kind" className="field"><option value="PAYMENT">Pembayaran</option><option value="REFUND">Refund</option></select></Field><Field label="CATATAN"><input name="note" className="field" /></Field></>
          : <><Field label="KATEGORI"><input name="category" required className="field" placeholder="HOSTING" /></Field><Field label="DESKRIPSI"><input name="description" required className="field" /></Field></>}
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}
