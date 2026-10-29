export type KpiMetricName = "REVENUE" | "PROJECTS_COMPLETED" | "TASK_POINTS_DONE" | "LEADS_CREATED" | "DEALS_WON" | "ON_TIME_RATE";

export const METRICS: Record<KpiMetricName, { label: string; unit: string; scope: "team" | "member"; hint: string }> = {
  REVENUE: { label: "Pendapatan bersih", unit: "Rp", scope: "team", hint: "Pembayaran dikurangi refund pada bulan ini" },
  PROJECTS_COMPLETED: { label: "Proyek selesai", unit: "proyek", scope: "team", hint: "Proyek berstatus selesai bulan ini" },
  ON_TIME_RATE: { label: "Tepat waktu", unit: "%", scope: "team", hint: "Proyek selesai sebelum/di tenggat" },
  TASK_POINTS_DONE: { label: "Effort point selesai", unit: "poin", scope: "member", hint: "Total effort tugas berstatus Done" },
  LEADS_CREATED: { label: "Prospek baru", unit: "prospek", scope: "member", hint: "Prospek yang dimasukkan bulan ini" },
  DEALS_WON: { label: "Deal tercapai", unit: "deal", scope: "member", hint: "Prospek yang menjadi deal bulan ini" },
};

export type KpiInput = {
  month: string;
  jakartaMonth: (d: Date) => string;
  ledger: { kind: string; amount: string; occurredAt: Date }[];
  projects: { completedAt: Date | null; deadline: Date | null; status: string }[];
  tasks: { assigneeId: string | null; status: string; effortPoints: number; completedAt: Date | null }[];
  clients: { ownerId: string | null; createdAt: Date; dealAt: Date | null }[];
};

/** Nilai aktual metrik untuk satu bulan; ownerId null = seluruh tim. */
export function kpiActual(metric: KpiMetricName, ownerId: string | null, d: KpiInput): number {
  const inMonth = (date: Date | null) => !!date && d.jakartaMonth(date) === d.month;
  switch (metric) {
    case "REVENUE":
      return Number(d.ledger.filter((l) => inMonth(l.occurredAt)).reduce((s, l) => s + (l.kind === "PAYMENT" ? 1n : -1n) * BigInt(l.amount), 0n));
    case "PROJECTS_COMPLETED":
      return d.projects.filter((p) => p.status === "COMPLETED" && inMonth(p.completedAt)).length;
    case "ON_TIME_RATE": {
      const done = d.projects.filter((p) => p.status === "COMPLETED" && inMonth(p.completedAt));
      if (!done.length) return 0;
      return Math.round(done.filter((p) => !p.deadline || p.completedAt! <= p.deadline).length / done.length * 100);
    }
    case "TASK_POINTS_DONE":
      return d.tasks.filter((t) => t.status === "DONE" && inMonth(t.completedAt) && (!ownerId || t.assigneeId === ownerId)).reduce((s, t) => s + t.effortPoints, 0);
    case "LEADS_CREATED":
      return d.clients.filter((c) => inMonth(c.createdAt) && (!ownerId || c.ownerId === ownerId)).length;
    case "DEALS_WON":
      return d.clients.filter((c) => inMonth(c.dealAt) && (!ownerId || c.ownerId === ownerId)).length;
  }
}

export const progressPct = (actual: number, target: number) => target > 0 ? Math.min(100, Math.round(actual / target * 100)) : 0;
