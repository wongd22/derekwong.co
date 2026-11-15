import { cloneElement, useCallback, useEffect, useRef, useState } from "react";

import good1 from "../components/assets/good-1.jpg";
import good2 from "../components/assets/good-2.jpg";
import good3 from "../components/assets/good-3.jpg";
import bad1 from "../components/assets/bad-1.jpg";
import bad2 from "../components/assets/bad-2.jpg";
import bad3 from "../components/assets/bad-3.jpg";
import bad4 from "../components/assets/bad-4.jpg";
import {
  ACTIVE_STEP,
  CHECKLIST,
  SESSION_WINDOW,
  STEPS,
  TF_ORDER,
  applyRecord,
  checklistPasses,
  emptyLedger,
  emptyMarks,
  evaluateGate,
  lossRecorded,
  lotSize,
  newDay,
  newWeek,
  normalizeLedger,
  oneRAmount,
  signedR,
} from "../lib/ritualGate";

const LS_KEY = "ptr-state-v1";

const WINS = [
  {
    img: good1,
    pair: "XAUUSD",
    date: "27 Feb 2026",
    tag: "6 / 7 checklist",
    head: "Right size, calm mind, exit at plan",
    quote:
      "Feel calm and not worry if lose — means bet size is correct. Right direction and execute to take profit when hit milestone.",
    points: [
      "W/D bias marked before anything else",
      "4H entry aligned with bias, 15m fine-tuned",
      "TP taken at the milestone, not at hope",
    ],
  },
  {
    img: good2,
    pair: "XAUUSD",
    date: "4 Mar 2026",
    tag: "Entry TF respected",
    head: "1m used only to fine-tune, never to decide",
    quote:
      "Decision timeframe 15m, TP at the targeted price of that timeframe. Did not over-leverage.",
    points: [
      "Structure came from W/D → 4H → 15m",
      "1m only refined the trigger, size stayed small",
      "Target was defined before entry",
    ],
  },
  {
    img: good3,
    pair: "GBPUSD",
    date: "3 Mar 2026",
    tag: "Clean execution",
    head: "Entry right, TP right — nothing improvised",
    quote: "Entry right and TP right.",
    points: [
      "Zone was marked in the morning, not in the moment",
      "Waited for price to come to the 禁區",
      "Closed at plan, no re-entry revenge",
    ],
  },
];

const LOSSES = [
  {
    img: bad1,
    pair: "EURUSD",
    date: "26 Feb 2026",
    tag: "FOMO into a weak trend",
    head: "Ticked the boxes, ignored the broken zone",
    quote:
      "FOMO to believe it is upward trend, but maybe it destroyed the upward 禁區 — so it is not strong upwards yet.",
    points: [
      "Trend was assumed, not confirmed on higher TF",
      "Zone was already broken — bias should be 0",
      "Checklist ticked to justify the trade, not to test it",
    ],
  },
  {
    img: bad2,
    pair: "—",
    date: "20 Feb 2026",
    tag: "Over traded",
    head: "Rushed into 1m to win it back",
    quote:
      "Over traded today, rush into 1m timeframe, lose discipline, urgent to win... Gamble into it. Remember what consistent means and it will compound.",
    points: [
      "Both risk rules failed: 1 loss max, and stop after a loss",
      "1m used as the decision timeframe — the cardinal sin",
      "Urgency to win replaced the plan",
    ],
  },
  {
    img: bad3,
    wide: true,
    pair: "GBPUSD",
    date: "11 Nov 2025",
    tag: "Entry on the line",
    head: "Bought the level, got swept",
    quote: "No review written — that silence is part of the lesson.",
    points: [
      "Entry sat right on the black S/R line, mid-channel",
      "Stop was inside the noise — one sweep took it out",
      "Price reclaimed the level immediately after",
    ],
  },
  {
    img: bad4,
    wide: true,
    pair: "EURUSD",
    date: "7 Oct 2025",
    tag: "Counter-trend on 5m",
    head: "Caught a falling market on the small timeframe",
    quote: "No review written — that silence is part of the lesson.",
    points: [
      "Long taken while 5m kept printing lower highs",
      "Decision made on 5m, not a fine-tune of a higher-TF idea",
      "Wick into the zone, then straight through the stop",
    ],
  },
];

function readState() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function useRitualGate() {
  const step = STEPS[ACTIVE_STEP];
  const [ledger, setLedger] = useState(emptyLedger);
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState({ bias: "", invalidation: "", target: "" });
  const [marks, setMarks] = useState(emptyMarks);
  const [stopTf, setStopTf] = useState("");
  const [targetTf, setTargetTf] = useState("");
  const [stopPips, setStopPips] = useState("");
  const [atr, setAtr] = useState("");
  const [pipValue, setPipValue] = useState("");

  useEffect(() => {
    const saved = readState();
    if (saved) setLedger(normalizeLedger(saved));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(ledger));
    } catch (e) {
      /* storage blocked — the gate still works for this session */
    }
  }, [ledger, hydrated]);

  const setPlanField = (key, value) => setPlan((current) => ({ ...current, [key]: value }));
  const setMark = (id, value) => setMarks((current) => ({ ...current, [id]: value }));
  const passes = checklistPasses(marks);
  const risk = oneRAmount(step);
  const verdict = evaluateGate({
    step,
    ledger,
    stopTf,
    targetTf,
    passes,
    stopPips,
    atr,
    plan,
  });

  return {
    step,
    risk,
    lots: lotSize(risk, stopPips, pipValue),
    ledger,
    plan,
    setPlanField,
    marks,
    setMark,
    passes,
    stopTf,
    setStopTf,
    targetTf,
    setTargetTf,
    stopPips,
    setStopPips,
    atr,
    setAtr,
    pipValue,
    setPipValue,
    record: (r) => setLedger((current) => applyRecord(current, r)),
    resetDay: () => setLedger((current) => newDay(current)),
    resetWeek: () => setLedger((current) => newWeek(current)),
    ...verdict,
  };
}

function Example({ trade, kind, className = "" }) {
  const ok = kind === "win";
  return (
    <section className={`ptr-slide ptr-example ${ok ? "is-good" : "is-bad"} ${className}`}>
      <div className="ptr-ex-left">
        <div className="ptr-ex-kicker">{ok ? "GOOD TRADE" : "BAD TRADE"}</div>
        <h2>{trade.head}</h2>
        <div className="ptr-meta">
          <span>{trade.pair}</span>
          <span>{trade.date}</span>
          <span className="ptr-tag">{trade.tag}</span>
        </div>
        <blockquote>{trade.quote}</blockquote>
        <ul>
          {trade.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
      <div className={`ptr-ex-right${trade.wide ? " is-wide" : ""}`}>
        <img src={trade.img} alt={`${trade.pair} chart, ${trade.date}`} />
      </div>
    </section>
  );
}

function Tick({ pressed, pass = false, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={pressed && pass ? "is-pass" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CheckItem({ item, value, onChange }) {
  const choose = (next) => onChange(item.id, value === next ? null : next);
  if (item.zone) {
    return (
      <div className="ptr-item">
        <h3>{item.label}</h3>
        <p className="ptr-note">{item.hint}</p>
        <p className="ptr-ask" id={`${item.id}-ask`}>
          mapped 禁區, or mid-zone?
        </p>
        <div className="ptr-ticks is-zone" role="group" aria-labelledby={`${item.id}-ask`}>
          <Tick pressed={value === "mapped"} pass onClick={() => choose("mapped")}>
            Mapped 禁區
          </Tick>
          <Tick pressed={value === "mid"} onClick={() => choose("mid")}>
            Mid-zone
          </Tick>
          <Tick pressed={value === "fail"} onClick={() => choose("fail")}>
            Fail
          </Tick>
        </div>
        {value === "mid" ? <p className="ptr-midnote">Mid-zone does not pass 禁區.</p> : null}
      </div>
    );
  }

  return (
    <div className="ptr-item">
      <h3>{item.label}</h3>
      <p className="ptr-note">{item.hint}</p>
      <div className="ptr-ticks" role="group" aria-label={item.label}>
        <Tick pressed={value === "pass"} pass onClick={() => choose("pass")}>
          Pass
        </Tick>
        <Tick pressed={value === "fail"} onClick={() => choose("fail")}>
          Fail
        </Tick>
      </div>
    </div>
  );
}

function Outcome({ cleared }) {
  return (
    <div className={`ptr-outcome ${cleared ? "is-execute" : "is-aside"}`} role="status">
      <p className="ptr-outcome-title">{cleared ? "Execute" : "Stand aside"}</p>
      <p className="ptr-outcome-line">
        {cleared
          ? "Gate clear — execute at 1R, then stop touching it."
          : "Gate closed — DO NOT TRADE."}
      </p>
    </div>
  );
}

function PermissionBody({ gate }) {
  const lost = lossRecorded(gate.ledger);
  return (
    <>
      <section className="ptr-block">
        <p className="ptr-kicker">1 · Plan</p>
        <h2>Bias, invalidation, one target.</h2>
        <label className="ptr-field" htmlFor="plan-bias">
          <span>Bias</span>
          <input
            id="plan-bias"
            value={gate.plan.bias}
            autoComplete="off"
            enterKeyHint="next"
            onChange={(event) => gate.setPlanField("bias", event.target.value)}
          />
        </label>
        <label className="ptr-field" htmlFor="plan-invalidation">
          <span>Invalidation</span>
          <input
            id="plan-invalidation"
            value={gate.plan.invalidation}
            autoComplete="off"
            enterKeyHint="next"
            onChange={(event) => gate.setPlanField("invalidation", event.target.value)}
          />
        </label>
        <label className="ptr-field" htmlFor="plan-target">
          <span>One target</span>
          <input
            id="plan-target"
            value={gate.plan.target}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => gate.setPlanField("target", event.target.value)}
          />
        </label>
      </section>

      <section className="ptr-block">
        <div className="ptr-block-head">
          <div>
            <p className="ptr-kicker">2 · Checklist</p>
            <h2>Five of seven, or no trade.</h2>
          </div>
          <p className="ptr-sum" aria-live="polite">
            <b>{gate.passes}</b>
            <span>of 7</span>
          </p>
        </div>
        <div className="ptr-items">
          {CHECKLIST.map((item) => (
            <CheckItem
              key={item.id}
              item={item}
              value={gate.marks[item.id]}
              onChange={gate.setMark}
            />
          ))}
        </div>
      </section>

      <section className="ptr-block">
        <p className="ptr-kicker">Last gate · 沒有答案，只有合理的行為</p>
        <h2>No entry until the gate is green.</h2>
        <div className="ptr-gate-grid">
          <div className="ptr-panel">
            <h3>1 · Timeframe lock</h3>
            <label className="ptr-field">
              <span>Stop timeframe</span>
              <select value={gate.stopTf} onChange={(event) => gate.setStopTf(event.target.value)}>
                <option value="">—</option>
                {TF_ORDER.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </label>
            <label className="ptr-field">
              <span>Target timeframe</span>
              <select value={gate.targetTf} onChange={(event) => gate.setTargetTf(event.target.value)}>
                <option value="">—</option>
                {TF_ORDER.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="ptr-panel">
            <h3>2 · Size in R</h3>
            <div className="ptr-rbox">
              <div>
                <span>1R</span>
                <b>{(gate.step.rPct * 100).toFixed(2)}%</b>
              </div>
              <div>
                <span>{gate.step.label}</span>
                <b className="ptr-usd">${gate.risk}</b>
              </div>
            </div>
            <label className="ptr-field">
              <span>Stop distance (pips)</span>
              <input
                type="number"
                inputMode="decimal"
                value={gate.stopPips}
                onChange={(event) => gate.setStopPips(event.target.value)}
              />
            </label>
            <label className="ptr-field">
              <span>ATR(15m) in pips</span>
              <input
                type="number"
                inputMode="decimal"
                value={gate.atr}
                onChange={(event) => gate.setAtr(event.target.value)}
              />
            </label>
            <label className="ptr-field">
              <span>Pip value per lot ($)</span>
              <input
                type="number"
                inputMode="decimal"
                value={gate.pipValue}
                onChange={(event) => gate.setPipValue(event.target.value)}
              />
            </label>
            <div className="ptr-lots">
              Size: <b>{gate.lots}</b> lots
            </div>
          </div>

          <div className="ptr-panel">
            <h3>3 · Bullets</h3>
            <div className="ptr-bullets" aria-hidden="true">
              {Array.from({ length: gate.step.buffer }).map((_, n) => (
                <span key={n} className={n < gate.bulletsLeft ? "is-live" : "is-spent"} />
              ))}
            </div>
            <p className="ptr-bullet-note">
              {gate.bulletsLeft} of {gate.step.buffer}R left. Target is +{gate.step.target}R to advance.
            </p>
            <div className="ptr-tally">
              <span>
                Today {signedR(gate.ledger.dayR)}
                {lost ? " · loss logged" : ""}
              </span>
              <span>Week {signedR(gate.ledger.weekR)}</span>
            </div>
            <div className="ptr-actions">
              <button type="button" onClick={() => gate.record(-1)}>−1R</button>
              <button type="button" onClick={() => gate.record(1)}>+1R</button>
              <button type="button" onClick={() => gate.record(2)}>+2R</button>
              <button type="button" className="ptr-ghost" onClick={gate.resetDay}>
                New day
              </button>
              <button type="button" className="ptr-ghost" onClick={gate.resetWeek}>
                New week
              </button>
            </div>
          </div>
        </div>

        <ul className="ptr-gatelist">
          {gate.gates.map((item) => (
            <li key={item.key} className={item.ok ? "is-ok" : "is-open"}>
              <b>
                <span aria-hidden="true">{item.ok ? "✓" : "–"}</span> {item.label}
              </b>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
        <Outcome cleared={gate.cleared} />
      </section>
    </>
  );
}

function Session({ gate, onReview }) {
  return (
    <div className="ptr-session">
      <div className="ptr-session-inner">
        <header className="ptr-session-head">
          <div>
            <p className="ptr-kicker">Permission now</p>
            <h1>Before you click.</h1>
            <p className="ptr-lead">Written plan, then the seven ticks, then the gate.</p>
          </div>
          <button type="button" className="ptr-quiet" onClick={onReview}>
            Review the ritual
          </button>
        </header>
        <PermissionBody gate={gate} />
      </div>
    </div>
  );
}

function Deck({ gate, onSession }) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const deckRef = useRef(null);
  const touchRef = useRef({ x: 0, y: 0, t: 0, axis: null, active: false, w: 1 });

  const slides = [
    <section className="ptr-slide ptr-cover">
      <div className="ptr-kicker">Read before every trade</div>
      <h1>
        Structure first.
        <br />
        The small timeframe is a scalpel,
        <br />
        not a compass.
      </h1>
      <p className="ptr-rule">
        順勢 → 擇地 → 擇時後動. If the higher timeframe did not give you the
        direction, there is no trade to fine-tune.
      </p>
      <ul className="ptr-facts">
        <li>1R = 0.5% — never think in USD</li>
        <li>One loss, then review</li>
        <li>10R buffer · 12R to pass</li>
        <li>Need 5 of 7 to fire</li>
      </ul>
    </section>,

    <section className="ptr-slide">
      <div className="ptr-kicker">The only sequence</div>
      <h2>Four steps. Never start in the middle.</h2>
      <div className="ptr-funnel">
        <div className="ptr-step">
          <div className="ptr-n">STEP 1 · STRUCTURE</div>
          <h3>4 timeframes of S/R</h3>
          <div className="ptr-tf">W · D · 4H · 1H</div>
          <ul>
            <li>Mark every S/R level</li>
            <li>Classify: range or trend</li>
            <li>Bias: +1 / 0 / −1</li>
          </ul>
        </div>
        <div className="ptr-step">
          <div className="ptr-n">STEP 2 · 突破</div>
          <h3>Drop 2 timeframes</h3>
          <div className="ptr-tf">S/R of the breakout</div>
          <ul>
            <li>Where did price break?</li>
            <li>Mark the breakout S/R</li>
            <li>Must agree with Step 1</li>
          </ul>
        </div>
        <div className="ptr-step">
          <div className="ptr-n">STEP 3 · ENTRY TF</div>
          <h3>OB · Momentum · Money · Direction</h3>
          <div className="ptr-tf">15m · the entry / decision timeframe</div>
          <ul>
            <li>Order block / 禁區</li>
            <li>Impulse breaks inertia</li>
            <li>Order flow: 2 tops 2 bottoms</li>
            <li>Direction matches bias</li>
          </ul>
        </div>
        <div className="ptr-step is-last">
          <div className="ptr-n">STEP 4 · ONLY AFTER</div>
          <h3>1m / 5m — fine-tune only</h3>
          <div className="ptr-tf">Zero decision power</div>
          <ul>
            <li>Only once the entry TF shows the chance</li>
            <li>Tighter stop, better price</li>
            <li>Never a reason to enter</li>
          </ul>
        </div>
      </div>
      <div className="ptr-warn">
        If you are looking at 1m and you cannot name the W/D bias and the breakout level out loud —{" "}
        <b>you are gambling, not trading.</b>
      </div>
    </section>,

    <section className="ptr-slide">
      <div className="ptr-kicker">Before you click</div>
      <h2>Five of seven, or no trade.</h2>
      <div className="ptr-cols">
        <div className="ptr-panel">
          <h3>Entry checklist</h3>
          <ul className="ptr-check">
            <li>順勢 <span>— aligned with higher TF</span></li>
            <li>原生段破慣性 <span>— impulse break</span></li>
            <li>禁區 <span>— price at a key zone</span></li>
            <li>黃金比率 <span>— Fib 61.8 confluence</span></li>
            <li>止蝕盤觸發 <span>— liquidity sweep</span></li>
            <li>時間配合 <span>— {SESSION_WINDOW}</span></li>
            <li>錢 <span>— order flow 2T 2B</span></li>
          </ul>
        </div>
        <div className="ptr-panel">
          <h3>Non-negotiables</h3>
          <ul className="ptr-stack">
            <li><b>Risk</b>Exactly 1R. 1R = 0.5% of the step balance. Never think in dollars.</li>
            <li><b>Timeframe</b>Stop and target must live on the same timeframe. No exceptions.</li>
            <li><b>TP &amp; SL</b>Both set at entry. Never manage from memory.</li>
            <li><b>At 1:1</b>Move SL to breakeven. 食半留半.</li>
            <li><b>After a loss</b>Stop. One loss per day, then review.</li>
            <li><b>Never</b>Add exposure to save a losing idea.</li>
          </ul>
        </div>
      </div>
    </section>,

    ...WINS.map((trade) => <Example trade={trade} kind="win" />),
    ...LOSSES.map((trade) => <Example trade={trade} kind="loss" />),

    <section className="ptr-slide ptr-gate">
      <PermissionBody gate={gate} />
    </section>,
  ];

  const total = slides.length;
  const go = useCallback(
    (n) => setI(Math.max(0, Math.min(total - 1, n))),
    [total]
  );

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target?.isContentEditable) {
        return;
      }
      if (tag === "BUTTON" && event.key === " ") return;
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(i + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(i - 1);
      }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, total]);

  useEffect(() => {
    const el = deckRef.current?.querySelectorAll(".ptr-slide")[i];
    if (el) el.scrollTop = 0;
  }, [i]);

  const onTouchStart = (event) => {
    if (event.touches.length !== 1) return;
    const t = event.touches[0];
    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
      t: Date.now(),
      axis: null,
      active: true,
      w: deckRef.current?.clientWidth || window.innerWidth || 1,
    };
  };

  const onTouchMove = (event) => {
    if (!touchRef.current.active) return;
    const t = event.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    if (!touchRef.current.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touchRef.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (touchRef.current.axis === "x") setDragging(true);
    }
    if (touchRef.current.axis !== "x") return;
    const atEdge = (dx > 0 && i === 0) || (dx < 0 && i === total - 1);
    setDrag(atEdge ? dx * 0.3 : dx);
  };

  const onTouchEnd = (event) => {
    if (!touchRef.current.active) return;
    const dx = (event.changedTouches[0]?.clientX ?? touchRef.current.x) - touchRef.current.x;
    const dt = Math.max(1, Date.now() - touchRef.current.t);
    const velocity = dx / dt;
    const threshold = Math.min(90, touchRef.current.w * 0.16);
    const axis = touchRef.current.axis;
    touchRef.current.active = false;
    setDragging(false);
    setDrag(0);
    if (axis !== "x") return;
    if (dx <= -threshold || velocity < -0.35) go(i + 1);
    else if (dx >= threshold || velocity > 0.35) go(i - 1);
  };

  return (
    <>
      <div
        className="ptr-progress"
        style={{ transform: `scaleX(${(i + 1) / total})` }}
        aria-hidden="true"
      />
      <main
        className="ptr-deck"
        ref={deckRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className={`ptr-track${dragging ? " is-dragging" : ""}`}
          style={{ transform: `translate3d(calc(${-i * 100}% + ${drag}px), 0, 0)` }}
        >
          {slides.map((el, n) =>
            cloneElement(el, {
              key: n,
              "aria-hidden": n === i ? undefined : "true",
              className: `${el.props.className || ""}${n === i ? " is-active" : ""}`.trim(),
            })
          )}
        </div>
      </main>
      {i === 0 && <div className="ptr-hint">Swipe →</div>}
      <div className="ptr-bar">
        <button type="button" className="ptr-quiet" onClick={onSession}>
          Permission now
        </button>
        <div className="ptr-dots">
          {slides.map((_, n) => (
            <button
              key={n}
              type="button"
              className={`ptr-dot${n === i ? " is-on" : ""}`}
              aria-label={`Go to slide ${n + 1}`}
              aria-current={n === i ? "true" : undefined}
              onClick={() => go(n)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="ptr-bar-end">
          <div className="ptr-count">
            {i + 1} / {total}
          </div>
          <div className="ptr-nav">
            <button type="button" aria-label="Previous slide" disabled={i === 0} onClick={() => go(i - 1)}>
              ←
            </button>
            <button type="button" aria-label="Next slide" disabled={i === total - 1} onClick={() => go(i + 1)}>
              →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PreTradeRitual() {
  const gate = useRitualGate();
  const [mode, setMode] = useState("session");

  return (
    <div className="ptr">
      <style>{css}</style>
      {mode === "session" ? (
        <Session gate={gate} onReview={() => setMode("teach")} />
      ) : (
        <Deck gate={gate} onSession={() => setMode("session")} />
      )}
    </div>
  );
}

const css = `
.ptr {
  --ptr-bg:#191919; --ptr-surface:#202020; --ptr-raised:#2a2a29; --ptr-line:rgba(255,255,255,.12);
  --ptr-txt:#fff; --ptr-dim:rgba(255,255,255,.62);
  --ptr-blue:#5E9FE8; --ptr-green:#72BC8F; --ptr-orange:#DE9255; --ptr-red:#E97366;
  --ptr-bar-h:calc(52px + env(safe-area-inset-bottom));
  position:relative; height:100vh; height:100svh; width:100%; overflow:hidden;
  overscroll-behavior:contain; -webkit-tap-highlight-color:transparent;
  background:var(--ptr-bg); color:var(--ptr-txt);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC",Helvetica,Arial,sans-serif;
  font-size:1rem; line-height:1.47; font-optical-sizing:auto;
  -webkit-font-smoothing:antialiased;
}
.ptr *, .ptr *::before, .ptr *::after { box-sizing:border-box; margin:0; padding:0; }
.ptr h1 { font-size:clamp(2.125rem,4.4vw,3.75rem); line-height:1.05; letter-spacing:-.022em; font-weight:700; }
.ptr h2 { font-size:clamp(1.35rem,2.5vw,2rem); line-height:1.12; letter-spacing:-.018em; font-weight:700; }
.ptr h3 { font-size:1.0625rem; line-height:1.25; letter-spacing:-.014em; font-weight:600; }
.ptr-kicker { color:var(--ptr-dim); font-size:.75rem; font-weight:600; letter-spacing:.06em; line-height:1.35; text-transform:uppercase; }

.ptr-session { height:100%; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:calc(1.25rem + env(safe-area-inset-top)) 1.25rem calc(2rem + env(safe-area-inset-bottom)); }
.ptr-session-inner { width:min(100%,40rem); margin:0 auto; display:flex; flex-direction:column; gap:2.75rem; }
.ptr-session-head { display:flex; flex-direction:column; align-items:flex-start; gap:.35rem; }
.ptr-session h1 { font-size:clamp(2rem,9vw,2.75rem); }
.ptr-lead { margin-top:.55rem; max-width:28rem; color:var(--ptr-dim); font-size:1.0625rem; line-height:1.4; letter-spacing:-.011em; }
.ptr button.ptr-quiet { appearance:none; background:none; border:none; color:var(--ptr-blue); font:inherit; font-size:1rem; font-weight:600; letter-spacing:-.011em; line-height:1.2; padding:.65rem 0; min-height:44px; text-align:left; cursor:pointer; }
.ptr button.ptr-quiet:active { opacity:.55; }
.ptr button.ptr-quiet:focus-visible, .ptr-ticks button:focus-visible, .ptr-field input:focus-visible, .ptr-field select:focus-visible { outline:2px solid var(--ptr-blue); outline-offset:3px; }

.ptr-block { display:flex; flex-direction:column; gap:.9rem; }
.ptr-block-head { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; }
.ptr-sum { display:flex; align-items:baseline; gap:.4rem; font-variant-numeric:tabular-nums; }
.ptr-sum b { font-size:2rem; line-height:.9; letter-spacing:-.03em; font-weight:700; }
.ptr-sum span { color:var(--ptr-dim); font-size:.95rem; font-weight:500; letter-spacing:0; }
.ptr-field { display:flex; flex-direction:column; gap:.3rem; }
.ptr-field > span { font-size:.75rem; font-weight:600; letter-spacing:.04em; line-height:1.3; text-transform:uppercase; color:var(--ptr-dim); }
.ptr-field input, .ptr-field select { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,.22); border-radius:0; color:var(--ptr-txt); padding:.7rem .1rem; min-height:48px; font:inherit; font-size:1.0625rem; line-height:1.3; letter-spacing:-.011em; }
.ptr-item { display:flex; flex-direction:column; gap:.45rem; padding:1rem 0 1.1rem; border-top:1px solid var(--ptr-line); }
.ptr-item h3 { font-size:1.1875rem; letter-spacing:-.016em; line-height:1.2; }
.ptr-note, .ptr-ask, .ptr-midnote { font-size:.9375rem; line-height:1.4; letter-spacing:0; }
.ptr-note, .ptr-midnote { color:var(--ptr-dim); }
.ptr-ticks { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-top:.15rem; }
.ptr-ticks.is-zone { grid-template-columns:1fr 1fr; }
.ptr-ticks.is-zone button:first-child { grid-column:1 / -1; }
.ptr-ticks button { min-height:48px; padding:.75rem .6rem; border:none; border-radius:12px; background:rgba(255,255,255,.06); color:var(--ptr-dim); font:inherit; font-size:1rem; font-weight:600; letter-spacing:-.011em; cursor:pointer; }
.ptr-ticks button:active { background:rgba(255,255,255,.12); }
.ptr-ticks button[aria-pressed="true"] { color:var(--ptr-txt); background:rgba(255,255,255,.14); }
.ptr-ticks button.is-pass { color:var(--ptr-green); background:rgba(114,188,143,.16); }

.ptr-outcome { margin-top:.4rem; padding-top:1.75rem; border-top:1px solid var(--ptr-line); display:flex; flex-direction:column; gap:.45rem; }
.ptr-outcome-title { font-size:clamp(2.75rem,12vw,4.25rem); line-height:.96; letter-spacing:-.035em; font-weight:700; font-optical-sizing:auto; }
.ptr-outcome.is-execute .ptr-outcome-title { color:var(--ptr-green); }
.ptr-outcome.is-aside .ptr-outcome-title { color:var(--ptr-txt); }
.ptr-outcome-line { max-width:22rem; font-size:1.0625rem; line-height:1.4; letter-spacing:-.011em; font-weight:500; color:var(--ptr-txt); }

.ptr-deck { height:100%; width:100%; position:relative; overflow:hidden; touch-action:pan-y; }
.ptr-track { display:flex; height:100%; width:100%; will-change:transform; transition:transform .55s cubic-bezier(.22,.9,.28,1); }
.ptr-track.is-dragging { transition:none; }
.ptr-slide {
  flex:0 0 100%; width:100%; height:100%;
  padding:calc(1.75rem + env(safe-area-inset-top)) 1.25rem calc(var(--ptr-bar-h) + 1.15rem);
  display:flex; flex-direction:column; justify-content:flex-start;
  overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
  opacity:.22; transform:scale(.94);
  transition:opacity .45s ease, transform .55s cubic-bezier(.22,.9,.28,1);
}
.ptr-slide.is-active { opacity:1; transform:none; }
.ptr-slide:not(.is-active) { pointer-events:none; }
.ptr-progress { position:absolute; top:0; left:0; right:0; height:3px; z-index:3; background:var(--ptr-blue); transform-origin:0 50%; transition:transform .55s cubic-bezier(.22,.9,.28,1); }
.ptr-hint { position:absolute; left:50%; bottom:calc(var(--ptr-bar-h) + 8px); z-index:2; font-size:.75rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--ptr-dim); pointer-events:none; animation:ptrHint 2.4s ease-in-out infinite; }
@keyframes ptrHint { 0%,100% { opacity:.3; transform:translate(-50%,0) } 50% { opacity:.9; transform:translate(calc(-50% + 7px),0) } }

.ptr-cover { justify-content:center; }
.ptr-cover .ptr-rule { margin-top:1.4rem; padding-left:1rem; border-left:3px solid var(--ptr-blue); color:var(--ptr-dim); font-size:1.125rem; line-height:1.45; letter-spacing:0; max-width:40rem; }
.ptr-facts { list-style:none; margin-top:1.75rem; display:flex; flex-direction:column; gap:.45rem; }
.ptr-facts li { font-size:.95rem; line-height:1.35; letter-spacing:-.011em; color:var(--ptr-dim); }

.ptr-funnel { display:flex; flex-direction:column; margin-top:1.25rem; }
.ptr-step { background:none; border:none; border-top:1px solid var(--ptr-line); border-radius:0; padding:1rem 0; display:flex; flex-direction:column; gap:.4rem; }
.ptr-step .ptr-n { font-size:.75rem; letter-spacing:.06em; color:var(--ptr-blue); font-weight:600; }
.ptr-step .ptr-tf { font-size:.875rem; line-height:1.35; color:var(--ptr-dim); font-variant-numeric:tabular-nums; letter-spacing:0; }
.ptr-step ul { list-style:none; display:flex; flex-direction:column; gap:.3rem; margin-top:.15rem; }
.ptr-step li { font-size:.9375rem; line-height:1.4; color:var(--ptr-dim); padding-left:.9rem; position:relative; }
.ptr-step li::before { content:""; position:absolute; left:0; top:.55rem; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.28); }
.ptr-step.is-last .ptr-n { color:var(--ptr-orange); }
.ptr-warn { margin-top:1rem; border-left:3px solid var(--ptr-red); padding:.15rem 0 .15rem 1rem; font-size:1rem; line-height:1.45; }
.ptr-warn b { color:var(--ptr-red); }

.ptr-cols { display:flex; flex-direction:column; gap:1.75rem; margin-top:1.25rem; }
.ptr-panel { background:none; border:none; padding:0; display:flex; flex-direction:column; gap:.75rem; }
.ptr-panel h3 { font-size:.75rem; letter-spacing:.06em; text-transform:uppercase; color:var(--ptr-dim); font-weight:600; }
.ptr-check { list-style:none; display:flex; flex-direction:column; gap:.7rem; }
.ptr-check li { font-size:1rem; line-height:1.4; letter-spacing:-.011em; padding-left:1.6rem; position:relative; }
.ptr-check li::before { content:""; position:absolute; left:0; top:.2rem; width:15px; height:15px; border:1.5px solid rgba(255,255,255,.28); border-radius:4px; }
.ptr-check li span { color:var(--ptr-dim); }
.ptr-stack { list-style:none; display:flex; flex-direction:column; gap:.85rem; }
.ptr-stack li { font-size:.975rem; line-height:1.4; letter-spacing:-.011em; padding-left:.8rem; border-left:2px solid var(--ptr-line); }
.ptr-stack li b { display:block; font-size:.75rem; letter-spacing:.06em; text-transform:uppercase; color:var(--ptr-dim); font-weight:600; margin-bottom:.15rem; }

.ptr-example { gap:1.15rem; align-items:flex-start; }
.ptr-ex-left { min-width:0; }
.ptr-ex-right, .ptr-ex-right.is-wide { width:100%; display:flex; }
.ptr-ex-right { order:-1; }
.ptr-ex-right img { width:100%; max-height:36svh; object-fit:contain; border-radius:10px; }
.ptr-ex-kicker { font-size:.75rem; letter-spacing:.08em; font-weight:700; margin-bottom:.7rem; }
.is-good .ptr-ex-kicker { color:var(--ptr-green); }
.is-bad .ptr-ex-kicker { color:var(--ptr-red); }
.ptr-meta { display:flex; gap:.55rem; align-items:center; margin-top:.9rem; flex-wrap:wrap; }
.ptr-meta span { font-size:.8125rem; color:var(--ptr-dim); letter-spacing:0; }
.ptr-meta .ptr-tag { border-radius:999px; padding:.2rem .7rem; }
.is-good .ptr-meta .ptr-tag { color:var(--ptr-green); }
.is-bad .ptr-meta .ptr-tag { color:var(--ptr-red); }
.ptr blockquote { margin-top:1rem; padding:.85rem 0 .85rem .9rem; border-left:3px solid var(--ptr-line); font-size:1rem; line-height:1.5; letter-spacing:-.011em; color:#e8e8e6; }
.is-good blockquote { border-left-color:var(--ptr-green); }
.is-bad blockquote { border-left-color:var(--ptr-red); }
.ptr-ex-left ul { list-style:none; margin-top:1rem; display:flex; flex-direction:column; gap:.5rem; }
.ptr-ex-left ul li { font-size:.9375rem; line-height:1.4; color:var(--ptr-dim); padding-left:1rem; position:relative; }
.ptr-ex-left ul li::before { content:""; position:absolute; left:0; top:.5rem; width:6px; height:6px; border-radius:50%; }
.is-good .ptr-ex-left ul li::before { background:var(--ptr-green); }
.is-bad .ptr-ex-left ul li::before { background:var(--ptr-red); }

.ptr-gate-grid { display:grid; grid-template-columns:1fr; gap:1.75rem; margin-top:.35rem; }
.ptr-rbox { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
.ptr-rbox > div { display:flex; flex-direction:column; gap:.15rem; padding-bottom:.35rem; border-bottom:1px solid var(--ptr-line); }
.ptr-rbox span { font-size:.6875rem; letter-spacing:.04em; text-transform:uppercase; color:var(--ptr-dim); font-weight:600; }
.ptr-rbox b { font-size:1.5rem; line-height:1.1; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.ptr-rbox .ptr-usd { color:var(--ptr-dim); font-size:1rem; font-weight:500; letter-spacing:0; }
.ptr-lots { font-size:.95rem; color:var(--ptr-dim); }
.ptr-lots b { color:var(--ptr-txt); font-size:1.25rem; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.ptr-bullets { display:flex; gap:.35rem; flex-wrap:wrap; }
.ptr-bullets span { width:14px; height:14px; border-radius:50%; }
.ptr-bullets .is-live { background:var(--ptr-green); }
.ptr-bullets .is-spent { background:none; border:1px solid var(--ptr-line); }
.ptr-bullet-note { font-size:.875rem; line-height:1.4; color:var(--ptr-dim); }
.ptr-tally { display:flex; gap:.9rem; flex-wrap:wrap; font-size:.875rem; line-height:1.35; font-variant-numeric:tabular-nums; }
.ptr-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.45rem; }
.ptr-actions button { width:100%; text-align:center; background:rgba(255,255,255,.08); border:none; border-radius:10px; color:var(--ptr-txt); padding:.55rem .4rem; min-height:44px; font:inherit; font-size:.95rem; font-weight:600; letter-spacing:-.011em; cursor:pointer; }
.ptr-actions button:active { background:rgba(255,255,255,.16); }
.ptr-actions .ptr-ghost { background:transparent; color:var(--ptr-dim); font-weight:500; }
.ptr-actions .ptr-ghost:active { background:rgba(255,255,255,.06); }
.ptr-gatelist { list-style:none; display:flex; flex-direction:column; margin-top:.5rem; }
.ptr-gatelist li { border-top:1px solid var(--ptr-line); padding:.75rem 0; display:flex; flex-direction:column; gap:.15rem; }
.ptr-gatelist li b { font-size:.95rem; font-weight:600; letter-spacing:-.011em; }
.ptr-gatelist li span { font-size:.8125rem; line-height:1.35; color:var(--ptr-dim); }
.ptr-gatelist .is-ok b { color:var(--ptr-green); }
.ptr-gatelist .is-open b { color:var(--ptr-dim); font-weight:500; }

.ptr-bar { position:absolute; left:0; right:0; bottom:0; z-index:4; min-height:var(--ptr-bar-h); display:flex; align-items:center; gap:.5rem; padding:0 .85rem env(safe-area-inset-bottom); font-size:.75rem; color:var(--ptr-dim); background:linear-gradient(to top,rgba(25,25,25,.96) 60%,rgba(25,25,25,0)); }
.ptr-bar .ptr-quiet { white-space:nowrap; padding:0; }
.ptr-bar-end { display:flex; align-items:center; gap:.5rem; margin-left:auto; }
.ptr-dots { display:none; align-items:center; flex-wrap:wrap; }
.ptr-dot { display:grid; place-items:center; width:22px; height:36px; background:none; border:none; padding:0; cursor:pointer; }
.ptr-dot span { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.24); }
.ptr-dot.is-on span { background:var(--ptr-blue); transform:scale(1.6); }
.ptr-count { font-variant-numeric:tabular-nums; white-space:nowrap; }
.ptr-nav { display:flex; gap:.4rem; }
.ptr-nav button { background:transparent; border:none; color:var(--ptr-txt); border-radius:10px; min-width:52px; height:44px; cursor:pointer; font-size:1.125rem; }
.ptr-nav button:active { opacity:.55; }
.ptr-nav button:disabled { opacity:.32; cursor:default; }
.ptr-nav button:focus-visible, .ptr-dot:focus-visible { outline:2px solid var(--ptr-blue); outline-offset:2px; }

@media (min-width:700px) {
  .ptr-session { padding-left:2.5rem; padding-right:2.5rem; }
  .ptr-session-head { flex-direction:row; justify-content:space-between; align-items:flex-end; gap:1.5rem; }
  .ptr-slide { padding:calc(3.5rem + env(safe-area-inset-top)) 4rem calc(var(--ptr-bar-h) + 1rem); justify-content:center; }
  .ptr-slide.ptr-gate, .ptr-slide.ptr-example { justify-content:flex-start; }
  .ptr-cover { justify-content:center; }
  .ptr-funnel { display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem; }
  .ptr-step { border-top:none; padding-top:0; }
  .ptr-step + .ptr-step { border-left:1px solid var(--ptr-line); padding-left:1.25rem; }
  .ptr-cols { display:grid; grid-template-columns:1.15fr 1fr; gap:2.5rem; }
  .ptr-example { flex-direction:row; gap:3rem; align-items:center; }
  .ptr-ex-left { flex:1 1 0; }
  .ptr-ex-right { flex:0 0 300px; order:0; width:auto; justify-content:center; }
  .ptr-ex-right.is-wide { flex:0 0 44%; }
  .ptr-ex-right img { width:auto; max-width:100%; max-height:76dvh; }
  .ptr-dots { display:flex; }
}
@media (min-width:900px) {
  .ptr-gate-grid { grid-template-columns:repeat(3,1fr); gap:2rem; }
  .ptr-gatelist { display:grid; grid-template-columns:repeat(3,1fr); gap:0 1.5rem; }
  .ptr-gatelist li { height:100%; }
}
@media (prefers-reduced-motion:no-preference) {
  .ptr-slide.is-active > * { animation:ptrUp .5s cubic-bezier(.22,.9,.28,1) both; }
  .ptr-slide.is-active > *:nth-child(2) { animation-delay:.05s }
  .ptr-slide.is-active > *:nth-child(3) { animation-delay:.1s }
  .ptr-slide.is-active > *:nth-child(4) { animation-delay:.15s }
  .ptr-slide.is-active > *:nth-child(5) { animation-delay:.2s }
}
@media (prefers-reduced-motion:reduce) {
  .ptr-track, .ptr-slide, .ptr-progress { transition:none !important; }
  .ptr-hint { animation:none; }
}
@keyframes ptrUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
`;
