import { cloneElement, useCallback, useEffect, useRef, useState } from "react";

import good1 from "../components/assets/good-1.jpg";
import good2 from "../components/assets/good-2.jpg";
import good3 from "../components/assets/good-3.jpg";
import bad1 from "../components/assets/bad-1.jpg";
import bad2 from "../components/assets/bad-2.jpg";
import bad3 from "../components/assets/bad-3.jpg";
import bad4 from "../components/assets/bad-4.jpg";

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
      "Entry timeframe 1m, TP at the targeted price of that timeframe. Did not over-leverage.",
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
          {trade.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div className={`ptr-ex-right${trade.wide ? " is-wide" : ""}`}>
        <img src={trade.img} alt={`${trade.pair} chart, ${trade.date}`} />
      </div>
    </section>
  );
}

export default function PreTradeRitual() {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const deckRef = useRef(null);
  const touch = useRef({ x: 0, y: 0, t: 0, axis: null, active: false, w: 1 });

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
      <div className="ptr-pills">
        <span className="ptr-pill">1 loss max per day</span>
        <span className="ptr-pill">1–3% risk per trade</span>
        <span className="ptr-pill">Need 5 of 7 to fire</span>
      </div>
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
          <div className="ptr-tf">The decision happens here</div>
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
            <li>時間配合 <span>— EU 2–5pm, Tue/Wed</span></li>
            <li>錢 <span>— order flow 2T 2B</span></li>
          </ul>
        </div>
        <div className="ptr-panel">
          <h3>Non-negotiables</h3>
          <ul className="ptr-stack">
            <li><b>Risk</b>1–3% per trade. Size so a loss feels boring.</li>
            <li><b>TP &amp; SL</b>Both set at entry. Never manage from memory.</li>
            <li><b>At 1:1</b>Move SL to breakeven. 食半留半.</li>
            <li><b>After a loss</b>Stop. One loss per day, then review.</li>
            <li><b>Never</b>Add exposure to save a losing idea.</li>
          </ul>
        </div>
      </div>
    </section>,

    ...WINS.map((t) => <Example trade={t} kind="win" />),
    ...LOSSES.map((t) => <Example trade={t} kind="loss" />),

    <section className="ptr-slide ptr-gate">
      <div className="ptr-kicker">Last gate</div>
      <h1>沒有答案，只有合理的行為</h1>
      <p className="ptr-sub">
        You cannot control the result. You can only control whether the sequence was followed and the size was
        right.
      </p>
      <div className="ptr-final">
        Fewer than 5 of 7? <span>DO NOT TRADE.</span>
      </div>
    </section>,
  ];

  const total = slides.length;
  const go = useCallback(
    (n) => setI(Math.max(0, Math.min(total - 1, n))),
    [total]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(i + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(i - 1);
      }
      if (e.key === "Home") go(0);
      if (e.key === "End") go(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, total]);

  // Every slide scrolls on its own — start each one at the top on mobile.
  useEffect(() => {
    const el = deckRef.current?.querySelectorAll(".ptr-slide")[i];
    if (el) el.scrollTop = 0;
  }, [i]);

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touch.current = {
      x: t.clientX,
      y: t.clientY,
      t: Date.now(),
      axis: null,
      active: true,
      w: deckRef.current?.clientWidth || window.innerWidth || 1,
    };
  };

  const onTouchMove = (e) => {
    if (!touch.current.active) return;
    const t = e.touches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    if (!touch.current.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touch.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (touch.current.axis === "x") setDragging(true);
    }
    if (touch.current.axis !== "x") return;
    // Rubber-band at the first and last slide.
    const atEdge = (dx > 0 && i === 0) || (dx < 0 && i === total - 1);
    setDrag(atEdge ? dx * 0.3 : dx);
  };

  const onTouchEnd = (e) => {
    if (!touch.current.active) return;
    const dx = (e.changedTouches[0]?.clientX ?? touch.current.x) - touch.current.x;
    const dt = Math.max(1, Date.now() - touch.current.t);
    const velocity = dx / dt; // px per ms
    const threshold = Math.min(90, touch.current.w * 0.16);
    const axis = touch.current.axis;
    touch.current.active = false;
    setDragging(false);
    setDrag(0);
    if (axis !== "x") return;
    if (dx <= -threshold || velocity < -0.35) go(i + 1);
    else if (dx >= threshold || velocity > 0.35) go(i - 1);
  };

  return (
    <div className="ptr">
      <style>{css}</style>
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
              className={`ptr-dot${n === i ? " is-on" : ""}`}
              aria-label={`Go to slide ${n + 1}`}
              aria-current={n === i ? "true" : undefined}
              onClick={() => go(n)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="ptr-count">
          {i + 1} / {total}
        </div>
        <div className="ptr-nav">
          <button aria-label="Previous slide" disabled={i === 0} onClick={() => go(i - 1)}>
            ←
          </button>
          <button aria-label="Next slide" disabled={i === total - 1} onClick={() => go(i + 1)}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const css = `
.ptr {
  --ptr-bg:#191919; --ptr-surface:#202020; --ptr-raised:#2a2a29; --ptr-line:rgba(255,255,255,.14);
  --ptr-txt:#fff; --ptr-dim:rgba(255,255,255,.62);
  --ptr-blue:#5E9FE8; --ptr-green:#72BC8F; --ptr-orange:#DE9255; --ptr-red:#E97366;
  --ptr-bar-h:calc(52px + env(safe-area-inset-bottom));
  position:relative; height:100vh; height:100svh; width:100%; overflow:hidden;
  overscroll-behavior:contain; -webkit-tap-highlight-color:transparent;
  background:var(--ptr-bg); color:var(--ptr-txt);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC",Helvetica,Arial,sans-serif;
  font-size:16px; line-height:1.5;
}
.ptr *, .ptr *::before, .ptr *::after { box-sizing:border-box; margin:0; padding:0; }
.ptr-deck { height:100%; width:100%; position:relative; overflow:hidden; touch-action:pan-y; }
.ptr-track {
  display:flex; height:100%; width:100%; will-change:transform;
  transition:transform .55s cubic-bezier(.22,.9,.28,1);
}
.ptr-track.is-dragging { transition:none; }
.ptr-slide {
  flex:0 0 100%; width:100%; height:100%;
  padding:56px 64px calc(var(--ptr-bar-h) + 16px);
  display:flex; flex-direction:column; justify-content:center;
  overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
  opacity:.22; transform:scale(.94);
  transition:opacity .45s ease, transform .55s cubic-bezier(.22,.9,.28,1);
}
.ptr-slide.is-active { opacity:1; transform:none; }
.ptr-slide:not(.is-active) { pointer-events:none; }
.ptr-progress { position:absolute; top:0; left:0; right:0; height:3px; z-index:3; background:var(--ptr-blue); transform-origin:0 50%; transition:transform .55s cubic-bezier(.22,.9,.28,1); }
.ptr-hint { position:absolute; left:50%; bottom:calc(var(--ptr-bar-h) + 8px); z-index:2; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ptr-dim); pointer-events:none; animation:ptrHint 2.4s ease-in-out infinite; }
@keyframes ptrHint { 0%,100% { opacity:.3; transform:translate(-50%,0) } 50% { opacity:.9; transform:translate(calc(-50% + 7px),0) } }
.ptr h1 { font-size:clamp(34px,4.4vw,60px); line-height:1.1; letter-spacing:-.02em; font-weight:700; }
.ptr h2 { font-size:clamp(22px,2.5vw,32px); line-height:1.2; letter-spacing:-.01em; font-weight:700; }
.ptr-kicker { color:var(--ptr-dim); font-size:13px; letter-spacing:.14em; text-transform:uppercase; margin-bottom:18px; }

.ptr-cover .ptr-rule { margin-top:28px; padding-left:18px; border-left:3px solid var(--ptr-blue); color:var(--ptr-dim); font-size:18px; max-width:640px; }
.ptr-pills { margin-top:40px; display:flex; gap:12px; flex-wrap:wrap; }
.ptr-pill { border:1px solid var(--ptr-line); border-radius:999px; padding:8px 16px; font-size:14px; color:var(--ptr-dim); }

.ptr-funnel { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:28px; }
.ptr-step { background:var(--ptr-surface); border:1px solid var(--ptr-line); border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:10px; }
.ptr-step .ptr-n { font-size:12px; letter-spacing:.12em; color:var(--ptr-blue); font-weight:600; }
.ptr-step h3 { font-size:18px; line-height:1.25; }
.ptr-step .ptr-tf { font-size:13px; color:var(--ptr-dim); font-variant-numeric:tabular-nums; }
.ptr-step ul { list-style:none; display:flex; flex-direction:column; gap:6px; margin-top:2px; }
.ptr-step li { font-size:14px; color:var(--ptr-dim); padding-left:14px; position:relative; }
.ptr-step li::before { content:""; position:absolute; left:0; top:9px; width:5px; height:5px; border-radius:50%; background:var(--ptr-line); }
.ptr-step.is-last { border-color:rgba(222,146,85,.5); background:rgba(222,146,85,.10); }
.ptr-step.is-last .ptr-n { color:var(--ptr-orange); }
.ptr-warn { margin-top:24px; border:1px solid rgba(233,115,102,.45); background:rgba(233,115,102,.10); border-radius:12px; padding:16px 20px; font-size:16px; }
.ptr-warn b { color:var(--ptr-red); }

.ptr-cols { display:grid; grid-template-columns:1.15fr 1fr; gap:24px; margin-top:24px; }
.ptr-panel { background:var(--ptr-surface); border:1px solid var(--ptr-line); border-radius:12px; padding:24px; }
.ptr-panel h3 { font-size:15px; letter-spacing:.1em; text-transform:uppercase; color:var(--ptr-dim); margin-bottom:16px; }
.ptr-check { list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:10px 20px; }
.ptr-check li { font-size:15px; padding-left:26px; position:relative; }
.ptr-check li::before { content:""; position:absolute; left:0; top:3px; width:16px; height:16px; border:1.5px solid var(--ptr-line); border-radius:4px; }
.ptr-check li span { color:var(--ptr-dim); }
.ptr-stack { list-style:none; display:flex; flex-direction:column; gap:12px; }
.ptr-stack li { font-size:15px; padding-left:16px; border-left:2px solid var(--ptr-line); }
.ptr-stack li b { display:block; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--ptr-dim); font-weight:600; margin-bottom:2px; }

.ptr-example { flex-direction:row; gap:48px; align-items:center; padding:48px 64px; }
.ptr-ex-left { flex:1 1 0; min-width:0; }
.ptr-ex-right { flex:0 0 300px; display:flex; justify-content:center; }
.ptr-ex-right.is-wide { flex:0 0 44%; align-items:center; }
.ptr-ex-right img { max-height:76dvh; max-width:100%; border-radius:10px; border:1px solid var(--ptr-line); }
.ptr-ex-kicker { font-size:12px; letter-spacing:.16em; font-weight:700; margin-bottom:14px; }
.is-good .ptr-ex-kicker { color:var(--ptr-green); }
.is-bad .ptr-ex-kicker { color:var(--ptr-red); }
.ptr-meta { display:flex; gap:10px; align-items:center; margin-top:16px; flex-wrap:wrap; }
.ptr-meta span { font-size:13px; color:var(--ptr-dim); }
.ptr-meta .ptr-tag { border:1px solid var(--ptr-line); border-radius:999px; padding:4px 12px; }
.is-good .ptr-meta .ptr-tag { border-color:rgba(114,188,143,.5); color:var(--ptr-green); }
.is-bad .ptr-meta .ptr-tag { border-color:rgba(233,115,102,.5); color:var(--ptr-red); }
.ptr blockquote { margin-top:22px; padding:16px 20px; border-radius:10px; font-size:16px; line-height:1.55; background:var(--ptr-surface); border-left:3px solid var(--ptr-line); color:#e8e8e6; }
.is-good blockquote { border-left-color:var(--ptr-green); }
.is-bad blockquote { border-left-color:var(--ptr-red); }
.ptr-ex-left ul { list-style:none; margin-top:20px; display:flex; flex-direction:column; gap:9px; }
.ptr-ex-left ul li { font-size:15px; color:var(--ptr-dim); padding-left:18px; position:relative; }
.ptr-ex-left ul li::before { content:""; position:absolute; left:0; top:9px; width:6px; height:6px; border-radius:50%; }
.is-good .ptr-ex-left ul li::before { background:var(--ptr-green); }
.is-bad .ptr-ex-left ul li::before { background:var(--ptr-red); }

.ptr-gate { align-items:center; text-align:center; }
.ptr-gate h1 { max-width:900px; }
.ptr-gate .ptr-sub { color:var(--ptr-dim); font-size:18px; margin-top:20px; max-width:620px; }
.ptr-gate .ptr-final { margin-top:36px; border:1px solid rgba(233,115,102,.5); background:rgba(233,115,102,.10); border-radius:14px; padding:22px 34px; font-size:22px; font-weight:600; }
.ptr-gate .ptr-final span { color:var(--ptr-red); }

.ptr-bar { position:absolute; left:0; right:0; bottom:0; z-index:4; min-height:var(--ptr-bar-h); display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 14px env(safe-area-inset-bottom); font-size:12px; color:var(--ptr-dim); background:linear-gradient(to top,rgba(25,25,25,.96) 55%,transparent); }
.ptr-dots { display:flex; align-items:center; flex-wrap:wrap; }
.ptr-dot { display:grid; place-items:center; width:22px; height:36px; background:none; border:none; padding:0; cursor:pointer; }
.ptr-dot span { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.24); transition:background .25s ease, transform .25s ease; }
.ptr-dot.is-on span { background:var(--ptr-blue); transform:scale(1.6); }
.ptr-count { font-variant-numeric:tabular-nums; white-space:nowrap; }
.ptr-nav { display:flex; gap:8px; }
.ptr-nav button { background:var(--ptr-raised); border:1px solid var(--ptr-line); color:var(--ptr-txt); border-radius:10px; min-width:48px; height:36px; cursor:pointer; font-size:16px; transition:transform .15s ease, background .2s ease, opacity .2s ease; }
.ptr-nav button:active { transform:scale(.93); background:#343433; }
.ptr-nav button:disabled { opacity:.32; cursor:default; }
.ptr-nav button:focus-visible, .ptr-dot:focus-visible { outline:2px solid var(--ptr-blue); outline-offset:2px; }

@media (max-width:900px) {
  .ptr { font-size:15px; }
  .ptr-slide { padding:28px 20px calc(var(--ptr-bar-h) + 18px); justify-content:flex-start; }
  .ptr h1 { font-size:clamp(27px,7.4vw,40px); }
  .ptr h2 { font-size:clamp(20px,5.6vw,28px); }
  .ptr-kicker { font-size:11px; margin-bottom:12px; }
  .ptr-cover { justify-content:center; }
  .ptr-cover .ptr-rule { font-size:16px; margin-top:20px; }
  .ptr-pills { margin-top:24px; gap:8px; }
  .ptr-pill { font-size:13px; padding:7px 13px; }
  .ptr-funnel { grid-template-columns:1fr; gap:10px; margin-top:18px; }
  .ptr-step { padding:14px; gap:6px; }
  .ptr-step h3 { font-size:16px; }
  .ptr-warn { margin-top:16px; padding:13px 15px; font-size:14px; }
  .ptr-cols { grid-template-columns:1fr; gap:14px; margin-top:18px; }
  .ptr-panel { padding:18px; }
  .ptr-check { grid-template-columns:1fr; }
  .ptr-example { flex-direction:column; gap:18px; align-items:flex-start; justify-content:flex-start; padding:24px 20px calc(var(--ptr-bar-h) + 18px); }
  .ptr-ex-left, .ptr-ex-right, .ptr-ex-right.is-wide { flex:none; width:100%; }
  .ptr-ex-right { order:-1; }
  .ptr-ex-right img { width:100%; max-height:36svh; object-fit:contain; }
  .ptr blockquote { margin-top:16px; padding:13px 15px; font-size:15px; }
  .ptr-gate { justify-content:center; }
  .ptr-gate .ptr-sub { font-size:16px; }
  .ptr-gate .ptr-final { margin-top:24px; padding:18px 22px; font-size:18px; }
}
@media (max-width:620px) {
  .ptr-dots { display:none; }
  .ptr-bar { justify-content:space-between; }
  .ptr-nav { flex:1; justify-content:flex-end; }
  .ptr-nav button { min-width:64px; height:42px; font-size:18px; }
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