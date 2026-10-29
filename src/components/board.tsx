"use client";

import { useMemo, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarClock, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Bar, Field, form, Header, Modal, ROLE_LABEL, TASK_COLS, dateInput, pct } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const COL_TONE: Record<string, string> = {
  BACKLOG: "bg-slate-400", TODO: "bg-sky-500", IN_PROGRESS: "bg-amber-500", REVIEW: "bg-violet-500", DONE: "bg-emerald-500",
};

function due(t: any) {
  if (!t.dueDate || t.status === "DONE") return null;
  const days = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Telat ${-days} hari`, cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" };
  if (days === 0) return { label: "Hari ini", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
  if (days <= 2) return { label: `${days} hari lagi`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
  return { label: new Date(t.dueDate).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }), cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300" };
}

const Avatar = ({ name }: { name?: string }) => name
  ? <span title={name} className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">{name[0]}</span>
  : <span title="Belum ditugaskan" className="flex size-6 items-center justify-center rounded-full border border-dashed border-slate-400 text-[11px] muted">?</span>;

function CardBody({ t, status }: { t: any; status: string }) {
  const d = due({ ...t, status });
  return <>
    <p className="pr-5 font-semibold leading-snug">{t.title}</p>
    <p className="muted mt-1 text-xs">{t.project.name}</p>
    {t.description && <p className="muted mt-2 line-clamp-2 text-xs">{t.description}</p>}
    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5"><span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">{t.effortPoints} poin</span>
        {d && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${d.cls}`}><CalendarClock size={11} />{d.label}</span>}</span>
      <Avatar name={t.assignee?.name} />
    </div>
  </>;
}

function Card({ t, status, canDrag, celebrate, onEdit, onDelete, onMove, isAdmin, members, onAssign }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: t.id, disabled: !canDrag });
  return <div ref={setNodeRef} className={`task-card panel relative p-4 text-sm transition-[opacity,box-shadow] ${canDrag ? "cursor-grab active:cursor-grabbing hover:shadow-md" : ""} ${isDragging ? "opacity-30" : ""} ${celebrate ? "celebrate" : ""}`}>
    <div {...(canDrag ? { ...attributes, ...listeners } : {})} aria-label={canDrag ? `Seret tugas ${t.title}` : undefined} className={canDrag ? "touch-none outline-offset-4" : ""}>
      {canDrag && <GripVertical size={15} aria-hidden className="muted absolute right-2 top-3.5" />}
      <CardBody t={t} status={status} />
    </div>
    {canDrag && <select aria-label="Pindah ke kolom" className="field mt-3 !py-1 text-xs" value={status} onChange={e => onMove(t, e.target.value)}>{TASK_COLS.map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select>}
    {isAdmin && <div className="mt-2 flex items-center justify-between gap-2 text-xs">
      <select aria-label="Penanggung jawab" className="field !w-auto !py-1 text-xs" value={t.assigneeId ?? ""} onChange={e => onAssign(t, e.target.value)}><option value="">Belum ditugaskan</option>{members.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
      <span className="flex gap-2"><button aria-label="Ubah tugas" className="muted hover:text-emerald-600" onClick={() => onEdit(t)}><Pencil size={13} /></button><button aria-label="Hapus tugas" className="muted hover:text-red-500" onClick={() => onDelete(t)}><Trash2 size={13} /></button></span>
    </div>}
  </div>;
}

function Column({ id, label, count, points, children, over }: any) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={`flex min-h-[260px] min-w-[240px] flex-col rounded-2xl border p-3 transition-all duration-200 ${isOver ? "scale-[1.01] border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:bg-emerald-500/10" : "border-transparent bg-slate-100/70 dark:bg-[#0d1511]"}`} aria-label={`Kolom ${label}`}>
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><span className={`size-2 rounded-full ${COL_TONE[id]}`} />{label}</span>
      <span className="muted text-xs">{count} · {points} poin</span>
    </div>
    <div className="flex flex-1 flex-col gap-3">{children}{count === 0 && <div className={`muted flex flex-1 items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs transition ${isOver ? "border-emerald-500 text-emerald-600" : "border-slate-300 dark:border-[#27382e]"}`}>{isOver ? "Lepaskan di sini" : "Kosong"}</div>}</div>
  </div>;
}

export default function Board({ data, act, me, isAdmin, flash }: any) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [project, setProject] = useState("");
  const [assignee, setAssignee] = useState("");
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [glow, setGlow] = useState<string | null>(null);

  const members = data.users.filter((u: any) => u.role !== "ADMIN");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const statusOf = (t: any) => moved[t.id] ?? t.status;
  const canDrag = (t: any) => isAdmin || t.assigneeId === me.id;

  const tasks = useMemo(() => data.tasks.filter((t: any) =>
    (!mine || t.assigneeId === me.id) && (!project || t.projectId === project) && (!assignee || (assignee === "none" ? !t.assigneeId : t.assigneeId === assignee)) &&
    (!q || `${t.title} ${t.project.name}`.toLowerCase().includes(q.toLowerCase()))), [data.tasks, mine, project, assignee, q, me.id]);
  const total = tasks.length, done = tasks.filter((t: any) => statusOf(t) === "DONE").length;

  async function move(t: any, status: string) {
    if (status === statusOf(t)) return;
    setMoved(m => ({ ...m, [t.id]: status }));
    const ok = await act("task.update", { id: t.id, status, assigneeId: t.assigneeId ?? "" });
    setMoved(m => { const { [t.id]: _drop, ...rest } = m; return rest; });
    if (ok && status === "DONE") { setGlow(t.id); flash(`Selesai! +${t.effortPoints} poin untuk ${t.assignee?.name ?? "tim"}`); setTimeout(() => setGlow(null), 1400); }
  }
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const t = data.tasks.find((x: any) => x.id === e.active.id);
    if (t && e.over) move(t, String(e.over.id));
  };
  const active = data.tasks.find((t: any) => t.id === activeId);

  return <>
    <Header title="Papan Tugas" sub={isAdmin ? "Seret kartu antar kolom untuk memperbarui progres, atur penanggung jawab di kartu." : "Seret tugas Anda ke kolom berikutnya saat progres berubah."}>
      {isAdmin && <button className="btn" onClick={() => setOpen(true)}><Plus size={16} />Jobdesk baru</button>}
    </Header>

    <div className="panel mb-5 p-4">
      <div className="mb-2 flex items-baseline justify-between text-sm"><span className="font-medium">{done} dari {total} tugas selesai</span><strong>{pct(done, total)}%</strong></div>
      <Bar value={pct(done, total)} />
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="relative min-w-[180px] flex-1"><Search size={14} className="muted absolute left-3 top-3" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari tugas…" className="field !pl-9" aria-label="Cari tugas" /></label>
        <select aria-label="Filter proyek" className="field !w-auto" value={project} onChange={e => setProject(e.target.value)}><option value="">Semua proyek</option>{data.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label="Filter anggota" className="field !w-auto" value={assignee} onChange={e => setAssignee(e.target.value)}><option value="">Semua anggota</option><option value="none">Belum ditugaskan</option>{members.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <button className={mine ? "btn" : "btn-ghost"} onClick={() => setMine(!mine)}>Tugas saya</button>
      </div>
    </div>

    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="grid gap-3 overflow-x-auto pb-3 md:grid-cols-5">
        {TASK_COLS.map(([status, label]) => { const col = tasks.filter((t: any) => statusOf(t) === status);
          return <Column key={status} id={status} label={label} count={col.length} points={col.reduce((s: number, t: any) => s + t.effortPoints, 0)}>
            {col.map((t: any) => <Card key={`${t.id}-${statusOf(t)}`} t={t} status={statusOf(t)} canDrag={canDrag(t)} celebrate={glow === t.id} isAdmin={isAdmin} members={members}
              onMove={move} onEdit={setEdit} onDelete={(x: any) => confirm(`Hapus tugas "${x.title}"?`) && act("task.delete", { id: x.id }, "Tugas dihapus")}
              onAssign={(x: any, id: string) => act("task.update", { id: x.id, status: x.status, assigneeId: id }, "Penanggung jawab diperbarui")} />)}
          </Column>; })}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(.2,.9,.3,1.2)" }}>
        {active && <div className="panel drag-ghost p-4 text-sm"><CardBody t={active} status={statusOf(active)} /></div>}
      </DragOverlay>
    </DndContext>
    {!canDragAny(data, me, isAdmin) && <p className="muted mt-3 text-xs">Belum ada tugas yang ditugaskan kepada Anda. Hubungi admin untuk jobdesk.</p>}

    {edit && <Modal title="Ubah tugas" onClose={() => setEdit(null)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("task.edit", { ...v, id: edit.id }, "Tugas diperbarui")) setEdit(null); })}>
        <Field label="JUDUL"><input name="title" required defaultValue={edit.title} className="field" /></Field>
        <Field label="DESKRIPSI"><textarea name="description" rows={2} defaultValue={edit.description ?? ""} className="field" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="EFFORT (1–5)"><input name="effortPoints" type="number" min={1} max={5} defaultValue={edit.effortPoints} required className="field" /></Field>
          <Field label="TENGGAT"><input name="dueDate" type="date" defaultValue={dateInput(edit.dueDate)} className="field" /></Field>
        </div>
        <Field label="LINK REPO"><input name="repoUrl" type="url" defaultValue={edit.repoUrl ?? ""} className="field" /></Field>
        <Field label="LINK FIGMA"><input name="figmaUrl" type="url" defaultValue={edit.figmaUrl ?? ""} className="field" /></Field>
        <Field label="LINK PREVIEW"><input name="previewUrl" type="url" defaultValue={edit.previewUrl ?? ""} className="field" /></Field>
        <button className="btn w-full">Simpan perubahan</button>
      </form></Modal>}
    {open && <Modal title="Jobdesk baru" onClose={() => setOpen(false)}>
      <form className="space-y-4" onSubmit={form(async v => { if (await act("task.create", v, "Jobdesk dibuat")) setOpen(false); })}>
        <Field label="JUDUL"><input name="title" required className="field" /></Field>
        <Field label="DESKRIPSI"><textarea name="description" rows={2} className="field" /></Field>
        <Field label="PROYEK"><select name="projectId" required className="field">{data.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PENANGGUNG JAWAB"><select name="assigneeId" className="field"><option value="">Belum ditugaskan</option>{members.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role]})</option>)}</select></Field>
          <Field label="EFFORT (1–5)"><input name="effortPoints" type="number" min={1} max={5} defaultValue={3} required className="field" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="STATUS AWAL"><select name="status" defaultValue="TODO" className="field">{TASK_COLS.map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select></Field>
          <Field label="TENGGAT"><input name="dueDate" type="date" className="field" /></Field>
        </div>
        <Field label="LINK REPO / FIGMA (opsional)"><input name="repoUrl" type="url" placeholder="https://" className="field" /></Field>
        <button className="btn w-full">Simpan</button>
      </form></Modal>}
  </>;
}

const canDragAny = (data: any, me: any, isAdmin: boolean) => isAdmin || data.tasks.some((t: any) => t.assigneeId === me.id);
