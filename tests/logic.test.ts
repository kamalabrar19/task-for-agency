import assert from "node:assert/strict";
import test from "node:test";
import { accumulateMonthlyPayouts, balanceWorkload, calculateProjectSplit, jakartaMonth } from "../src/lib/finance";

test("split equally after receipts and costs, retaining indivisible rupiah", () => {
  const result = calculateProjectSplit([{ kind: "PAYMENT", amount: "400000" }, { kind: "REFUND", amount: "1" }], [{ amount: "100000" }]);
  assert.equal(result.netProfit, BigInt(299999));
  assert.equal(result.individualShare, BigInt(74999));
  assert.equal(result.undistributedRemainder, BigInt(3));
});

test("negative profit never becomes a negative payout", () => {
  assert.equal(calculateProjectSplit([], [{ amount: "500" }]).individualShare, BigInt(0));
});

test("payout month uses Jakarta timezone and excludes pending transfers", () => {
  const paidAt = new Date("2026-01-31T18:00:00Z");
  assert.equal(jakartaMonth(paidAt), "2026-02");
  assert.deepEqual(accumulateMonthlyPayouts([
    { memberId: "veby", status: "PAID", paidAt, amount: "25000" },
    { memberId: "veby", status: "PENDING", paidAt: null, amount: "999" },
  ], "2026-02", ["veby", "dilo"]), { veby: BigInt(25000), dilo: BigInt(0) });
});

test("balances only active tasks; tie-break order is stable", () => {
  const result = balanceWorkload([
    { assigneeId: "dilo", status: "IN_PROGRESS", effortPoints: 5 },
    { assigneeId: "natah", status: "DONE", effortPoints: 5 },
    { assigneeId: "abe", status: "BACKLOG", effortPoints: 3 },
  ], 3, ["dilo", "natah", "abe"]);
  assert.equal(result.suggestedAssignee, "natah");
  assert.deepEqual(result.projectedPoints, { dilo: 5, natah: 3, abe: 0 });
});

test("kpi actuals: revenue nets refunds, points scoped per member", async () => {
  const { kpiActual, progressPct } = await import("../src/lib/kpi");
  const input = {
    month: "2026-02", jakartaMonth,
    ledger: [{ kind: "PAYMENT", amount: "1000", occurredAt: new Date("2026-02-10T00:00:00Z") }, { kind: "REFUND", amount: "100", occurredAt: new Date("2026-02-11T00:00:00Z") }],
    projects: [], clients: [],
    tasks: [
      { assigneeId: "a", status: "DONE", effortPoints: 3, completedAt: new Date("2026-02-12T00:00:00Z") },
      { assigneeId: "b", status: "DONE", effortPoints: 5, completedAt: new Date("2026-02-12T00:00:00Z") },
      { assigneeId: "a", status: "DONE", effortPoints: 2, completedAt: new Date("2026-01-12T00:00:00Z") },
    ],
  };
  assert.equal(kpiActual("REVENUE", null, input), 900);
  assert.equal(kpiActual("TASK_POINTS_DONE", "a", input), 3);
  assert.equal(kpiActual("TASK_POINTS_DONE", null, input), 8);
  assert.equal(progressPct(150, 100), 100);
});
