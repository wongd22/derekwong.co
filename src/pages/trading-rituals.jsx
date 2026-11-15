import { cloneElement, useCallback, useEffect, useRef, useState } from "react";

import good1 from "../components/assets/good-1.jpg";
import good2 from "../components/assets/good-2.jpg";
import good3 from "../components/assets/good-3.jpg";
import bad1 from "../components/assets/bad-1.jpg";
import bad2 from "../components/assets/bad-2.jpg";
import bad3 from "../components/assets/bad-3.jpg";
import bad4 from "../components/assets/bad-4.jpg";

const SESSION_WINDOW =
  "2–5pm and 7–9pm HKT on weekdays (2–5 is London, 7–9 is New York)";

const HELD = [
  {
    img: good1,
    pair: "XAUUSD",
    date: "27 Feb 2026",
    tag: "6 / 7 checklist",
    head: "Correct size and a calm mind",
    quote:
      "Feel calm and not worry if lose — means bet size is correct. Right direction, and close at the plan when the milestone is hit.",
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
    head: "15m decides, 1m only fine-tunes",
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
    head: "Wait for the 禁區 and close at the plan, no revenge re-entry",
    quote: "Closed at the plan — nothing improvised.",
    points: [
      "Zone was marked in the morning, not in the moment",
      "Waited for price to come to the 禁區",
      "Closed at plan, no re-entry revenge",
    ],
  },
];

const BREAKS = [
  {
    img: bad1,
    pair: "EURUSD",
    date: "26 Feb 2026",
    tag: "FOMO into a weak trend",
    head: "Ticking the list to justify FOMO",
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
    head: "Rushing to 1m to win it back",
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
    head: "Buying mid-channel",
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
    head: "Deciding on 5m against the move",
    quote: "No review written — that silence is part of the lesson.",
    points: [
      "Long taken while 5m kept printing lower highs",
      "Decision made on 5m, not a fine-tune of a higher-TF idea",
      "Wick into the zone, then straight through the stop",
    ],
  },
];

function Example({ trade, tone, className = "", "aria-hidden": ariaHidden }) {
  const held = tone === "held";
  return (
    <section
      aria-hidden={ariaHidden}
      className={`ptr-slide ptr-example ${held ? "is-held" : "is-break"} ${className}`.trim()}
    >
      <div className="ptr-ex-left">
        <div className="ptr-ex-kicker">
          {held ? "What good execution looks like" : "What this is not"}
        </div>
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

function Deck() {
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
        <li>Weekly stop (−4R)</li>
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
            <li>禁區 <span>— price at a key zone. Mid-zone does not pass 禁區.</span></li>
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
            <li><b>Weekly stop</b>−4R.</li>
            <li><b>Never</b>Add exposure to save a losing idea.</li>
          </ul>
        </div>
      </div>
    </section>,

    ...HELD.map((trade) => <Example trade={trade} tone="held" />),
    ...BREAKS.map((trade) => <Example trade={trade} tone="break" />),

    <section className="ptr-slide ptr-close">
      <p className="ptr-kicker">Stand aside</p>
      <h1>沒有答案，只有合理的行為</h1>
      <p className="ptr-rule">
        Sitting out is executing the plan — if you cannot name bias, invalidation, and the 禁區 out loud, there is no trade.
      </p>
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
  return (
    <div className="ptr">
      <style>{css}</style>
      <Deck />
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

.ptr-cover, .ptr-close { justify-content:center; }
.ptr-cover .ptr-rule, .ptr-close .ptr-rule { margin-top:1.4rem; padding-left:1rem; border-left:3px solid var(--ptr-blue); color:var(--ptr-dim); font-size:1.125rem; line-height:1.45; letter-spacing:0; max-width:40rem; }
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
.ptr-check li { font-size:1rem; line-height:1.4; letter-spacing:-.011em; padding-left:1rem; position:relative; }
.ptr-check li::before { content:""; position:absolute; left:0; top:.55rem; width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,.28); }
.ptr-check li span { color:var(--ptr-dim); }
.ptr-stack { list-style:none; display:flex; flex-direction:column; gap:.85rem; }
.ptr-stack li { font-size:.975rem; line-height:1.4; letter-spacing:-.011em; padding-left:.8rem; border-left:2px solid var(--ptr-line); }
.ptr-stack li b { display:block; font-size:.75rem; letter-spacing:.06em; text-transform:uppercase; color:var(--ptr-dim); font-weight:600; margin-bottom:.15rem; }

.ptr-example { gap:1.15rem; align-items:flex-start; }
.ptr-ex-left { min-width:0; }
.ptr-ex-right, .ptr-ex-right.is-wide { width:100%; display:flex; }
.ptr-ex-right { order:-1; }
.ptr-ex-right img { width:100%; max-height:36svh; object-fit:contain; border-radius:10px; }
.ptr-ex-kicker { font-size:.75rem; letter-spacing:.08em; font-weight:700; margin-bottom:.7rem; text-transform:uppercase; }
.is-held .ptr-ex-kicker { color:var(--ptr-green); }
.is-break .ptr-ex-kicker { color:var(--ptr-red); }
.ptr-meta { display:flex; gap:.55rem; align-items:center; margin-top:.9rem; flex-wrap:wrap; }
.ptr-meta span { font-size:.8125rem; color:var(--ptr-dim); letter-spacing:0; }
.ptr-meta .ptr-tag { border-radius:999px; padding:.2rem .7rem; }
.is-held .ptr-meta .ptr-tag { color:var(--ptr-green); }
.is-break .ptr-meta .ptr-tag { color:var(--ptr-red); }
.ptr blockquote { margin-top:1rem; padding:.85rem 0 .85rem .9rem; border-left:3px solid var(--ptr-line); font-size:1rem; line-height:1.5; letter-spacing:-.011em; color:#e8e8e6; }
.is-held blockquote { border-left-color:var(--ptr-green); }
.is-break blockquote { border-left-color:var(--ptr-red); }
.ptr-ex-left ul { list-style:none; margin-top:1rem; display:flex; flex-direction:column; gap:.5rem; }
.ptr-ex-left ul li { font-size:.9375rem; line-height:1.4; color:var(--ptr-dim); padding-left:1rem; position:relative; }
.ptr-ex-left ul li::before { content:""; position:absolute; left:0; top:.5rem; width:6px; height:6px; border-radius:50%; }
.is-held .ptr-ex-left ul li::before { background:var(--ptr-green); }
.is-break .ptr-ex-left ul li::before { background:var(--ptr-red); }

.ptr-bar { position:absolute; left:0; right:0; bottom:0; z-index:4; min-height:var(--ptr-bar-h); display:flex; align-items:center; gap:.5rem; padding:0 .85rem env(safe-area-inset-bottom); font-size:.75rem; color:var(--ptr-dim); background:linear-gradient(to top,rgba(25,25,25,.96) 60%,rgba(25,25,25,0)); }
.ptr-bar-end { display:flex; align-items:center; gap:.5rem; margin-left:auto; }
.ptr-dots { display:none; align-items:center; flex-wrap:wrap; margin-left:auto; }
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
  .ptr-slide { padding:calc(3.5rem + env(safe-area-inset-top)) 4rem calc(var(--ptr-bar-h) + 1rem); justify-content:center; }
  .ptr-slide.ptr-example { justify-content:flex-start; }
  .ptr-cover, .ptr-close { justify-content:center; }
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
