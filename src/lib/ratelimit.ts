const hits = new Map<string, number[]>();

/** Batasi percobaan per kunci dalam jendela waktu. Cukup untuk 1 instance; ganti dengan Redis bila multi-instance. */
export function tooManyAttempts(key: string, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}
