"use client";

import { FormEvent, ReactNode } from "react";
import { X } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Data = any;

export const TASK_COLS: [string, string][] = [["BACKLOG", "Backlog"], ["TODO", "To Do"], ["IN_PROGRESS", "Dikerjakan"], ["REVIEW", "Review"], ["DONE", "Selesai"]];
export const LEAD_COLS: [string, string][] = [["PROSPECT", "Prospek"], ["NEGOTIATION", "Negosiasi"], ["PROPOSAL_SENT", "Proposal"], ["DEAL", "Deal"], ["LOST", "Batal"]];
export const PROJECT_STATUS: [string, string][] = [["PLANNED", "Direncanakan"], ["ACTIVE", "Berjalan"], ["REVIEW", "Review"], ["COMPLETED", "Selesai"], ["CANCELLED", "Dibatalkan"]];
export const SERVICES: Record<string, string> = { LANDING_PAGE: "Landing Page", COMPANY_PROFILE: "Company Profile", CUSTOM_SYSTEM: "Sistem Web Custom", INTEGRATION: "Integrasi & Maintenance" };
export const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", MARKETING: "Marketing Strategist", DEVELOPER: "Developer" };
export const rupiah = (v: string | number | bigint) => `Rp ${BigInt(v).toLocaleString("id-ID")}`;
export const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }) : "—";
export const HEALTH_TONE: Record<string, string> = {
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", ON_TRACK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  AT_RISK: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", LATE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300", NO_DEADLINE: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
};
export const dateInput = (d?: string | null) => d ? new Date(d).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) : "";
export const pct = (a: number, t: number) => t > 0 ? Math.min(100, Math.round(a / t * 100)) : 0;

/* ---------- shared ---------- */
export function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{sub && <p className="muted mt-1 text-sm">{sub}</p>}</div>{children}</div>;
}
export function Bar({ value, tone = "violet" }: { value: number; tone?: string }) {
  const color = value >= 100 ? "bg-emerald-500" : tone === "violet" ? "bg-emerald-500" : "bg-sky-500";
  return <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#1d2c24]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} /></div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="panel modal-in max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Tutup"><X size={18} /></button></div>{children}
    </div></div>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-semibold muted">{label}<div className="mt-1.5 text-sm font-normal">{children}</div></label>;
}
export const form = (fn: (v: Record<string, string>) => Promise<unknown>) => async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  await fn(v);
};
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return <div className="panel p-5"><p className="muted text-xs font-semibold uppercase tracking-wider">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p>{sub && <p className="muted mt-1 text-xs">{sub}</p>}</div>;
}
