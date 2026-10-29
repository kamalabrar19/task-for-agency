export type Receipt = { kind: "PAYMENT" | "REFUND"; amount: string };
export type ExpenseInput = { amount: string };

export function calculateProjectSplit(receipts: readonly Receipt[], expenses: readonly ExpenseInput[]) {
  const received = receipts.reduce((sum, row) => sum + (row.kind === "PAYMENT" ? BigInt(1) : -BigInt(1)) * BigInt(row.amount), BigInt(0));
  const operationalCosts = expenses.reduce((sum, row) => sum + BigInt(row.amount), BigInt(0));
  const netProfit = received - operationalCosts;
  const distributable = netProfit > BigInt(0) ? netProfit : BigInt(0);
  return {
    received,
    operationalCosts,
    netProfit,
    individualShare: distributable / BigInt(4),
    undistributedRemainder: distributable % BigInt(4),
  };
}

export function jakartaMonth(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

export function accumulateMonthlyPayouts<T extends string>(
  payouts: readonly { memberId: T; amount: string; status: "PENDING" | "PAID"; paidAt: Date | null }[],
  month: string,
  memberIds: readonly T[],
) {
  const totals = Object.fromEntries(memberIds.map((id) => [id, BigInt(0)])) as Record<T, bigint>;
  for (const payout of payouts) {
    if (payout.status === "PAID" && payout.paidAt && jakartaMonth(payout.paidAt) === month) {
      totals[payout.memberId] = ((totals[payout.memberId] as bigint) ?? BigInt(0)) + BigInt(payout.amount);
    }
  }
  return totals;
}

export function balanceWorkload<T extends string>(
  tasks: readonly { assigneeId: T | null; status: string; effortPoints: number }[],
  newTaskPoints: number,
  developers: readonly T[],
  eligibleDevelopers: readonly T[] = developers,
) {
  if (!Number.isInteger(newTaskPoints) || newTaskPoints < 1 || newTaskPoints > 5) throw new Error("Effort points harus 1–5");
  const candidates = developers.filter((id) => eligibleDevelopers.includes(id));
  if (!candidates.length) throw new Error("Tidak ada developer yang tersedia");
  const points = Object.fromEntries(developers.map((id) => [id, 0])) as Record<T, number>;
  for (const task of tasks) {
    if (task.assigneeId && task.assigneeId in points && ["TODO", "IN_PROGRESS", "REVIEW"].includes(task.status)) {
      points[task.assigneeId] += task.effortPoints;
    }
  }
  const suggestedAssignee = candidates.reduce((best, id) => points[id] < points[best] ? id : best);
  return { currentPoints: points, suggestedAssignee, projectedPoints: { ...points, [suggestedAssignee]: points[suggestedAssignee] + newTaskPoints } };
}

export function rupiah(value: bigint | string | number) {
  return `Rp ${BigInt(value).toLocaleString("id-ID")}`;
}
