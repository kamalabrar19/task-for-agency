export type Health = "DONE" | "ON_TRACK" | "AT_RISK" | "LATE" | "NO_DEADLINE";

export const HEALTH_LABEL: Record<Health, string> = {
  DONE: "Selesai", ON_TRACK: "Sesuai jadwal", AT_RISK: "Perlu perhatian", LATE: "Terlambat", NO_DEADLINE: "Tanpa tenggat",
};

/** Bandingkan progres tugas dengan waktu yang sudah berjalan menuju tenggat. */
export function projectHealth(p: { status: string; deadline: Date | string | null; createdAt: Date | string; done: number; total: number }, now = new Date()): Health {
  if (p.status === "COMPLETED") return "DONE";
  if (!p.deadline) return "NO_DEADLINE";
  const end = new Date(p.deadline).getTime(), start = new Date(p.createdAt).getTime(), t = now.getTime();
  const progress = p.total ? p.done / p.total : 0;
  if (t > end) return "LATE";
  const expected = end > start ? (t - start) / (end - start) : 1;
  const daysLeft = (end - t) / 86400000;
  if (progress < expected - 0.25 || (daysLeft <= 3 && progress < 0.8)) return "AT_RISK";
  return "ON_TRACK";
}
