// Risk figures stay as written. R is a percent of the step balance, never USD.
// Daily rule is one logged loss, then review — there is no −2R daily stop.
export const STEPS = {
  step1: { label: "Step 1 · $5,000", balance: 5000, rPct: 0.005, buffer: 10, target: 12 },
  step2: { label: "Step 2 · $10,000", balance: 10000, rPct: 0.005, buffer: 10, target: 12 },
  step3: { label: "Step 3 · $15,000", balance: 15000, rPct: 0.005, buffer: 10, target: 12 },
  funded: { label: "Funded · $20,000", balance: 20000, rPct: 0.004, buffer: 10, target: 12.5 },
};

export const ACTIVE_STEP = "step1";
export const WEEKLY_STOP_R = 4;
export const CHECKS_REQUIRED = 5;

export const SESSION_WINDOW =
  "2–5pm and 7–9pm HKT on weekdays (2–5 is London, 7–9 is New York)";

export const TF_ORDER = ["1m", "5m", "15m", "1H", "4H", "D", "W"];

export const CHECKLIST = [
  { id: "trend", label: "順勢", hint: "aligned with higher TF" },
  { id: "impulse", label: "原生段破慣性", hint: "impulse break" },
  { id: "zone", label: "禁區", hint: "price at a key zone", zone: true },
  { id: "fib", label: "黃金比率", hint: "Fib 61.8 confluence" },
  { id: "sweep", label: "止蝕盤觸發", hint: "liquidity sweep" },
  { id: "time", label: "時間配合", hint: SESSION_WINDOW },
  { id: "flow", label: "錢", hint: "order flow 2T 2B" },
];

export function emptyMarks() {
  return Object.fromEntries(CHECKLIST.map((item) => [item.id, null]));
}

export function emptyLedger() {
  return { usedR: 0, dayR: 0, weekR: 0, lostToday: false };
}

export function oneRAmount(step) {
  return Math.round(step.balance * step.rPct * 100) / 100;
}

export function written(value) {
  return String(value ?? "").trim().length > 0;
}

export function planReady(plan) {
  if (!plan) return false;
  return written(plan.bias) && written(plan.invalidation) && written(plan.target);
}

// Only an explicit pass counts. Mid-zone is an answer on 禁區 and is not a pass.
export function markPasses(item, value) {
  if (item.zone) return value === "mapped";
  return value === "pass";
}

export function checklistPasses(marks) {
  return CHECKLIST.reduce((total, item) => {
    return total + (markPasses(item, marks?.[item.id]) ? 1 : 0);
  }, 0);
}

export function lossRecorded(ledger) {
  if (!ledger) return false;
  return Boolean(ledger.lostToday) || Number(ledger.dayR) < 0;
}

export function normalizeLedger(saved) {
  const empty = emptyLedger();
  if (!saved || typeof saved !== "object") return empty;
  const dayR = Number.isFinite(Number(saved.dayR)) ? Number(saved.dayR) : 0;
  const weekR = Number.isFinite(Number(saved.weekR)) ? Number(saved.weekR) : 0;
  const usedR = Number.isFinite(Number(saved.usedR)) ? Number(saved.usedR) : 0;
  return {
    usedR,
    dayR,
    weekR,
    lostToday: Boolean(saved.lostToday) || dayR < 0,
  };
}

export function applyRecord(ledger, r) {
  const n = Number(r);
  return {
    usedR: n < 0 ? ledger.usedR + Math.abs(n) : ledger.usedR,
    dayR: Math.round((ledger.dayR + n) * 100) / 100,
    weekR: Math.round((ledger.weekR + n) * 100) / 100,
    lostToday: n < 0 ? true : Boolean(ledger.lostToday),
  };
}

export function newDay(ledger) {
  return { ...ledger, dayR: 0, lostToday: false };
}

export function newWeek(ledger) {
  return { ...ledger, dayR: 0, weekR: 0, lostToday: false };
}

export function signedR(n) {
  const value = Number(n) || 0;
  return `${value > 0 ? "+" : ""}${value}R`;
}

export function lotSize(riskAmount, stopPips, pipValue) {
  const stop = Number(stopPips);
  const pip = Number(pipValue);
  if (!stopPips || !pipValue || !(stop > 0) || !(pip > 0)) return "—";
  return (riskAmount / (stop * pip)).toFixed(2);
}

export function evaluateGate({
  step,
  ledger,
  stopTf,
  targetTf,
  passes,
  stopPips,
  atr,
  plan,
}) {
  const bulletsLeft = Math.max(0, step.buffer - (Number(ledger?.usedR) || 0));
  const tfOk = stopTf !== "" && stopTf === targetTf;
  const checksOk = passes >= CHECKS_REQUIRED;
  const bulletsOk = bulletsLeft > 0;
  const dayOk = !lossRecorded(ledger);
  const weekOk = Number(ledger?.weekR) > -WEEKLY_STOP_R;
  const atrOk =
    atr !== "" && stopPips !== "" && Number(stopPips) >= Number(atr) * 0.5;
  const planOk = planReady(plan);
  const weekValue = Number(ledger?.weekR) || 0;

  const gates = [
    {
      key: "plan",
      ok: planOk,
      label: "Bias, invalidation, one target",
      detail: planOk ? "Written" : "All three, in words. Blank does not pass.",
    },
    {
      key: "tf",
      ok: tfOk,
      label: "Stop TF = Target TF",
      detail: tfOk
        ? `Both on ${stopTf} — the stop marks where the idea is wrong`
        : "A stop on a lower TF than the target is a fake R:R",
    },
    {
      key: "check",
      ok: checksOk,
      label: "Checklist ≥ 5 of 7",
      detail: `${passes} passed`,
    },
    {
      key: "atr",
      ok: atrOk,
      label: "Stop ≥ 0.5 × ATR(15m)",
      detail: atrOk
        ? "Stop sits outside the noise band"
        : "Enter both numbers. A tighter stop is a 1m stop in disguise",
    },
    {
      key: "bullets",
      ok: bulletsOk,
      label: "Bullets remaining",
      detail: `${bulletsLeft} of ${step.buffer}R left before the account dies`,
    },
    {
      key: "day",
      ok: dayOk,
      label: "One loss, then review",
      detail: dayOk ? "No loss logged today" : "Loss logged — closed until a new day",
    },
    {
      key: "week",
      ok: weekOk,
      label: `Weekly stop (−${WEEKLY_STOP_R}R)`,
      detail: `${signedR(weekValue)} this week`,
    },
  ];

  return {
    bulletsLeft,
    gates,
    cleared: gates.every((gate) => gate.ok),
  };
}
