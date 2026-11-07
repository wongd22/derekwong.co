import React, { useEffect, useMemo, useState } from 'react';
import { Home, Link2, List, LayoutGrid, LogOut, PenLine, RefreshCw, Search, SlidersHorizontal, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import ListingCard from '../components/spending/ListingCard';
import SpendMap from '../components/spending/SpendMap';
import { formatHkd, formatMonthOption } from '../../shared/spending/format.js';
import '../styles/spending.css';

const PERSONAL_FORM = 'https://forms.gle/KQuSFhzTKtXgf98k8';
const WELLON_FORM = 'https://forms.gle/5J55inBAGSwi6wrD8';

function monthOptions(latestKey) {
  if (!latestKey) return [];
  const [yearText, monthText] = latestKey.split('-');
  const end = Number(yearText) * 12 + Number(monthText);
  const start = 2026 * 12 + 1;
  const options = [];
  for (let cursor = end; cursor >= start; cursor -= 1) {
    const year = Math.floor((cursor - 1) / 12);
    const month = ((cursor - 1) % 12) + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    options.push({ key, label: formatMonthOption(year, month) });
  }
  return options;
}

function updatedLabel(iso) {
  if (!iso) return '';
  const text = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Hong_Kong',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return `Updated ${text}`;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function Spending() {
  const [phase, setPhase] = useState('checking');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [latestKey, setLatestKey] = useState('');
  const [month, setMonth] = useState('');
  const [source, setSource] = useState('all');
  const [envelope, setEnvelope] = useState('all');
  const [kind, setKind] = useState('all');
  const [moreOpen, setMoreOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('amount');
  const [layout, setLayout] = useState('list');
  const [mapOpen, setMapOpen] = useState(false);
  const [visible, setVisible] = useState(4);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Spending';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    meta.dataset.spending = 'true';
    document.head.appendChild(meta);
    return () => {
      document.title = previous;
      meta.remove();
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const response = await fetch('/api/spending/session');
        const body = await readJson(response);
        if (cancel) return;
        if (!body.gateConfigured) {
          setMessage('The gate password is not set on the server.');
          setPhase('setup');
          return;
        }
        if (body.authenticated) {
          await loadMonth('', { fresh: true, initial: true });
          return;
        }
        setPhase('gate');
      } catch {
        if (!cancel) {
          setMessage('The gate could not be checked.');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancel = true;
    };
    // The first session check owns the initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMonth(nextMonth, { fresh = true, initial = false } = {}) {
    setBusy(true);
    const params = new URLSearchParams();
    if (nextMonth) params.set('month', nextMonth);
    if (fresh) params.set('fresh', '1');
    try {
      const response = await fetch(`/api/spending/summary?${params.toString()}`);
      const body = await readJson(response);
      if (response.status === 401) {
        setData(null);
        setPhase('gate');
        return;
      }
      if (!response.ok || body.ok === false) {
        if (body.code === 'setup') {
          setMessage(body.message || 'The ledgers are not connected yet.');
          setData(null);
          setPhase('setup');
          return;
        }
        setMessage(body.hint ? `${body.message} ${body.hint}` : (body.message || 'The ledgers could not be read.'));
        setPhase('error');
        return;
      }
      setData(body);
      setMonth(body.month.key);
      if (initial || !latestKey) setLatestKey(body.month.current ? body.month.key : latestKey || body.month.key);
      setPhase('ready');
      setVisible(4);
    } catch {
      setMessage('The ledgers could not be read.');
      setPhase('error');
    } finally {
      setBusy(false);
    }
  }

  async function unlock(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/spending/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        setMessage(body.message || body.error || 'That password does not match.');
        setPhase(body.code === 'setup' ? 'setup' : 'gate');
        return;
      }
      setPassword('');
      await loadMonth('', { fresh: true, initial: true });
    } catch {
      setMessage('The gate could not be checked.');
      setPhase('error');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch('/api/spending/logout', { method: 'POST' });
    setData(null);
    setPassword('');
    setPhase('gate');
  }

  async function copyLink() {
    const url = `${window.location.origin}/spending`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const filtered = useMemo(() => {
    if (!data) return { cards: [], recent: [] };
    const needle = query.trim().toLowerCase();
    const remarkHits = new Set();
    data.recent.forEach((item) => {
      const blob = `${item.category} ${item.remarks} ${item.sourceLabel}`.toLowerCase();
      if (!needle || blob.includes(needle)) remarkHits.add(item.envelopeId);
    });

    const cards = data.envelopes.filter((item) => {
      if (source !== 'all' && item.source !== source) return false;
      if (envelope !== 'all' && item.id !== envelope) return false;
      if (kind === 'discretionary' && item.role !== 'discretionary') return false;
      if (kind === 'hot' && !item.overWritten) return false;
      if (!needle) return true;
      const blob = `${item.title} ${item.blurb} ${item.roleLabel} ${item.categories.map((category) => category.name).join(' ')}`.toLowerCase();
      return blob.includes(needle) || remarkHits.has(item.id);
    });

    cards.sort((a, b) => {
      if (sort === 'date') {
        return String(b.lastLogged || '').localeCompare(String(a.lastLogged || ''));
      }
      return b.spent - a.spent;
    });

    const recent = data.recent.filter((item) => {
      if (source !== 'all' && item.source !== source) return false;
      if (envelope !== 'all' && item.envelopeId !== envelope) return false;
      if (kind === 'discretionary' && item.role !== 'discretionary' && item.role !== 'unknown') return false;
      if (!needle) return true;
      return `${item.category} ${item.remarks} ${item.sourceLabel}`.toLowerCase().includes(needle);
    });

    return { cards, recent };
  }, [data, source, envelope, kind, query, sort]);

  const hotYear = data?.yearly.filter((item) => item.state === 'over' || item.state === 'close') || [];
  const dotClass = data?.taxMonth
    ? 'is-tax'
    : data?.underLogged.active
      ? 'is-thin'
      : data?.status.code === 'stop'
        ? 'is-stop'
        : data?.status.code === 'tighten'
          ? 'is-tighten'
          : '';

  return (
    <div className="spending-shell">
      <div className="sp-frame">
        <nav className="sp-rail" aria-label="Spending">
          <span className="sp-mark" aria-hidden="true"><Wallet size={18} /></span>
          <Link to="/" aria-label="Home"><Home size={18} /></Link>
          <button type="button" className="is-active" aria-label="Search" onClick={() => document.querySelector('.sp-search input')?.focus()}>
            <Search size={18} />
          </button>
          <a href={data?.forms?.personal || PERSONAL_FORM} target="_blank" rel="noreferrer" aria-label="Add a personal entry" title="Add a personal entry">
            <PenLine size={18} />
          </a>
          <a href={data?.forms?.wellOn || WELLON_FORM} target="_blank" rel="noreferrer" aria-label="Add a Well On entry" title="Add a Well On entry">
            <PenLine size={18} />
          </a>
          <span className="sp-rail-spacer" />
          {phase === 'ready' && (
            <button type="button" aria-label="Sign out" onClick={signOut}>
              <LogOut size={18} />
            </button>
          )}
        </nav>

        <div className={`sp-main ${phase === 'ready' ? 'is-ready' : ''}`}>
          {phase === 'checking' && <p className="sp-quiet">Checking the gate.</p>}

          {phase === 'gate' && (
            <section className="sp-gate">
              <h1>Spending</h1>
              <p>Private month check. Enter the gate password to see this month.</p>
              <form onSubmit={unlock}>
                <label className="sp-quiet" htmlFor="spending-password">Password</label>
                <input
                  id="spending-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {message && <p className="sp-error">{message}</p>}
                <button type="submit" disabled={busy || !password}>{busy ? 'Checking' : 'Unlock'}</button>
              </form>
            </section>
          )}

          {phase === 'setup' && (
            <section className="sp-setup">
              <h1>Spending</h1>
              <h2>Connect the ledgers</h2>
              <p>{message}</p>
              <p className="sp-quiet">
                Set the gate password and a Google service account on the server. Share both spreadsheets with that account as a viewer. This page will not invent totals.
              </p>
            </section>
          )}

          {phase === 'error' && (
            <section className="sp-setup">
              <h1>Spending</h1>
              <p className="sp-error">{message}</p>
              <button type="button" className="sp-primary" onClick={() => loadMonth(month, { fresh: true })}>Refresh</button>
            </section>
          )}

          {phase === 'ready' && data && (
            <>
              {data.fixture && <p className="sp-banner">Sample data. This is not the live ledger.</p>}
              <header className="sp-top">
                <div>
                  <h1>{data.month.title}</h1>
                  <p>{data.subhead}</p>
                </div>
                <div className="sp-actions">
                  <button type="button" className="sp-ghost" onClick={copyLink}>
                    <Link2 size={16} aria-hidden="true" />
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <button type="button" className="sp-ghost" onClick={() => loadMonth(month, { fresh: true })} disabled={busy}>
                    <RefreshCw size={16} aria-hidden="true" />
                    Refresh
                  </button>
                </div>
              </header>

              <section className="sp-status" aria-live="polite">
                <div className="sp-headline">
                  <span className={`sp-dot ${dotClass}`} aria-hidden="true" />
                  <div>
                    <h2>{data.headline}</h2>
                    <p className="sp-quiet">{data.status.label}. {updatedLabel(data.asOf)} Hong Kong time.</p>
                  </div>
                </div>
                <div className={`sp-metric ${data.offerRoom ? '' : 'is-muted'}`}>
                  <span>Everyday remaining</span>
                  <strong>{data.remainingAverage == null ? 'Not offered' : formatHkd(data.remainingAverage)}</strong>
                  <small>{data.remainingCaption}</small>
                </div>
                <div className={`sp-metric ${data.offerRoom ? '' : 'is-muted'}`}>
                  <span>Plan safe remaining</span>
                  <strong>{data.remainingPlan == null ? 'Not offered' : formatHkd(data.remainingPlan)}</strong>
                  <small>{data.planCaption}</small>
                </div>
                <div className="sp-span">
                  <div className="sp-lines">
                    {data.lines.map((line) => (
                      <div key={line.id}>
                        <span>{line.label}</span>
                        <strong>{formatHkd(line.amount)}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="sp-pace">
                    {data.taxMonth
                      ? `Projected month end ${formatHkd(data.projectedMonthEnd)}. Everyday and plan safe targets are paused.`
                      : `Projected month end ${formatHkd(data.projectedMonthEnd)}. Even pace ${formatHkd(data.evenPaceAverage)} average · ${formatHkd(data.evenPaceCap)} cap.`}
                  </p>
                  {data.underLogged.active && (
                    <div className="sp-warning">
                      {data.underLogged.reasons.map((reason) => <p key={reason}>{reason}</p>)}
                      {data.status.code !== 'on_track' && data.status.code !== 'tax_month' && <p>{data.status.detail}</p>}
                    </div>
                  )}
                  {data.status.cutOrder && <p className="sp-note">{data.status.cutOrder}</p>}
                  {data.contextNote && <p className="sp-context">{data.contextNote}</p>}
                  <p className="sp-note">{data.outsideNote}</p>
                  {data.notices.personalEmpty && <p className="sp-note">{data.notices.personalEmptyText}</p>}
                  {data.notices.wellOnEmpty && <p className="sp-note">{data.notices.wellOnEmptyText}</p>}
                  {data.notices.skipped > 0 && (
                    <p className="sp-note">Some rows were skipped because a date or amount could not be read.</p>
                  )}
                </div>
              </section>

              <div className="sp-filters">
                <select
                  className="sp-pill"
                  aria-label="Month"
                  value={month}
                  onChange={(event) => loadMonth(event.target.value, { fresh: true })}
                >
                  {monthOptions(latestKey || month).map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <select className="sp-pill" aria-label="Source" value={source} onChange={(event) => { setSource(event.target.value); setVisible(4); }}>
                  <option value="all">All sources</option>
                  <option value="personal">Personal</option>
                  <option value="wellOn">Well On</option>
                </select>
                <select className="sp-pill" aria-label="Envelope" value={envelope} onChange={(event) => { setEnvelope(event.target.value); setVisible(4); }}>
                  <option value="all">All envelopes</option>
                  {data.envelopes.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <button type="button" className="sp-ghost" onClick={() => setMoreOpen((open) => !open)}>
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  More filters
                </button>
              </div>
              {moreOpen && (
                <div className="sp-more">
                  <button type="button" className={`sp-text ${kind === 'all' ? 'is-active' : ''}`} onClick={() => setKind('all')}>Any pace</button>
                  <button type="button" className={`sp-text ${kind === 'discretionary' ? 'is-active' : ''}`} onClick={() => setKind('discretionary')}>Discretionary</button>
                  <button type="button" className={`sp-text ${kind === 'hot' ? 'is-active' : ''}`} onClick={() => setKind('hot')}>Over written</button>
                </div>
              )}

              <form
                className="sp-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuery(draft);
                  setVisible(4);
                }}
              >
                <input
                  aria-label="Search categories and remarks"
                  placeholder="Search categories and remarks"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className="sp-search-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft('');
                      setQuery('');
                      setVisible(4);
                    }}
                  >
                    Clear
                  </button>
                  <button type="submit" className="sp-primary">Search</button>
                </div>
              </form>

              <div className="sp-sort">
                <div className="sp-sort-left">
                  <button type="button" className={`sp-text ${sort === 'date' ? 'is-active' : ''}`} onClick={() => setSort('date')}>Sort by date</button>
                  <button type="button" className={`sp-text ${sort === 'amount' ? 'is-active' : ''}`} onClick={() => setSort('amount')}>Sort by amount</button>
                </div>
                <div className="sp-view" role="group" aria-label="Layout">
                  <button type="button" className={`sp-map-toggle ${mapOpen ? 'is-active' : ''}`} onClick={() => setMapOpen((open) => !open)}>Map</button>
                  <button type="button" aria-label="List" className={layout === 'list' ? 'is-active' : ''} onClick={() => setLayout('list')}>
                    <List size={16} />
                  </button>
                  <button type="button" aria-label="Grid" className={layout === 'grid' ? 'is-active' : ''} onClick={() => setLayout('grid')}>
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
              <p className="sp-note">The status line uses the full month. Filters only change the list and the map.</p>

              <div className="sp-split">
                <div className="sp-list">
                  {filtered.cards.length === 0 ? (
                    <div className="sp-empty">Nothing matches that search.</div>
                  ) : (
                    <div className={`sp-cards ${layout === 'grid' ? 'is-grid' : ''}`}>
                      {filtered.cards.slice(0, visible).map((item) => (
                        <ListingCard key={item.id} item={item} layout={layout} />
                      ))}
                    </div>
                  )}

                  <section className="sp-recent">
                    <h3>Recent entries</h3>
                    {filtered.recent.length === 0 && <p className="sp-quiet">No entries for this filter.</p>}
                    <ul>
                      {filtered.recent.slice(0, visible).map((item) => (
                        <li key={item.id}>
                          <span>{item.dateLabel}</span>
                          <span>
                            {item.sourceLabel} · {item.category}
                            {item.remarks ? ` · ${item.remarks}` : ''}
                            {item.payer ? ` · ${item.payer}` : ''}
                          </span>
                          <strong>
                            {formatHkd(item.amount)}
                            {item.source === 'wellOn' ? ` his half ${formatHkd(item.hisShare)}` : ''}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {(filtered.cards.length > visible || filtered.recent.length > visible) && (
                    <button type="button" className="sp-more-btn" onClick={() => setVisible((count) => count + 8)}>
                      Show more
                    </button>
                  )}

                  <section className="sp-year">
                    <h3>Yearly watch</h3>
                    {hotYear.length === 0 ? (
                      <p className="sp-quiet">Nothing is close to a yearly watch yet.</p>
                    ) : (
                      <ul>
                        {hotYear.map((item) => (
                          <li key={item.id}>
                            <span>{item.label} · {item.stateLabel}</span>
                            <strong>{formatHkd(item.spent)} of {formatHkd(item.target)}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <div className="sp-forms">
                    <a href={data.forms.personal} target="_blank" rel="noreferrer">Add a personal entry</a>
                    <a href={data.forms.wellOn} target="_blank" rel="noreferrer">Add a Well On entry</a>
                  </div>
                </div>
              </div>
              <SpendMap
                envelopes={filtered.cards}
                transactions={filtered.recent}
                open={mapOpen}
                onSelect={(id) => {
                  setEnvelope(id);
                  setVisible(4);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
