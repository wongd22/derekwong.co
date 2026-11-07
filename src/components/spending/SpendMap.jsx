import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatHkd } from '../../../shared/spending/format.js';

const SPOTS = {
  normal: { x: 62, y: 24 },
  love: { x: 36, y: 40 },
  special: { x: 74, y: 48 },
  trip: { x: 30, y: 66 },
  wellOn: { x: 56, y: 74 },
  karen: { x: 80, y: 30 },
  other: { x: 48, y: 54 },
};

const LABELS = [
  { text: 'Normal', x: '58%', y: '16%' },
  { text: 'Meals', x: '68%', y: '32%' },
  { text: 'What I love', x: '18%', y: '34%' },
  { text: 'Special', x: '70%', y: '58%' },
  { text: 'Trip', x: '16%', y: '58%' },
  { text: 'Well On', x: '46%', y: '84%' },
  { text: 'Karen', x: '78%', y: '18%' },
  { text: 'Books', x: '22%', y: '48%' },
];

function MapArt() {
  return (
    <div className="sp-map-art" aria-hidden="true">
      <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="520" fill="#e6e8eb" />
        <path d="M0 70 H400 M0 150 H400 M0 250 H400 M0 340 H400 M0 430 H400" stroke="#f7f7f8" strokeWidth="10" />
        <path d="M70 0 V520 M150 0 V520 M250 0 V520 M330 0 V520" stroke="#f7f7f8" strokeWidth="8" />
        <path d="M0 118 H400 M90 0 V520 M210 0 V520" stroke="#d5d8dc" strokeWidth="2" />
        <rect x="168" y="168" width="70" height="54" rx="6" fill="#f4f5f6" />
        <rect x="258" y="86" width="58" height="46" rx="6" fill="#f4f5f6" />
        <rect x="40" y="300" width="84" height="48" rx="6" fill="#f4f5f6" />
        <path d="M20 390 C80 360 120 420 180 400 C230 384 250 450 320 430 C360 418 390 460 400 470 V520 H20 Z" fill="#d7e0e6" />
        <path d="M250 250 C300 230 340 270 330 320 C318 360 270 350 250 310 Z" fill="#dfe7df" />
      </svg>
      {LABELS.map((label) => (
        <span key={label.text} className="sp-map-label" style={{ left: label.x, top: label.y }}>
          {label.text}
        </span>
      ))}
    </div>
  );
}

function buildPins(envelopes, transactions, mode) {
  if (mode === 'entries') {
    const groups = new Map();
    transactions.forEach((item) => {
      const list = groups.get(item.envelopeId) || [];
      list.push(item);
      groups.set(item.envelopeId, list);
    });
    return [...groups.entries()].map(([id, list]) => {
      const top = [...list].sort((a, b) => b.hisShare - a.hisShare)[0];
      const spot = SPOTS[id] || SPOTS.other;
      return {
        id,
        x: spot.x,
        y: spot.y,
        amount: top.hisShare,
        extra: Math.max(0, list.length - 1),
        envelopeId: id,
      };
    });
  }

  return envelopes
    .filter((item) => item.spent !== 0)
    .map((item) => {
      const spot = SPOTS[item.id] || SPOTS.other;
      const extra = Math.max(0, item.categories.length - 1);
      return {
        id: item.id,
        x: spot.x,
        y: spot.y,
        amount: item.spent,
        extra,
        envelopeId: item.id,
      };
    });
}

export default function SpendMap({ envelopes, transactions, open, onSelect }) {
  const [mode, setMode] = useState('pins');
  const [zoom, setZoom] = useState(1);
  const pins = useMemo(
    () => buildPins(envelopes, transactions, mode),
    [envelopes, transactions, mode],
  );

  return (
    <aside className={`sp-map ${open ? 'is-open' : ''}`} aria-label="Spend map">
      <div className="sp-map-toolbar">
        <div className="sp-map-switch" role="group" aria-label="Map style">
          <button type="button" className={mode === 'pins' ? 'is-active' : ''} onClick={() => setMode('pins')}>Pins</button>
          <button type="button" className={mode === 'entries' ? 'is-active' : ''} onClick={() => setMode('entries')}>Entries</button>
        </div>
        <div className="sp-zoom">
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.4, value + 0.15))}>
            <Plus size={16} />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.15))}>
            <Minus size={16} />
          </button>
        </div>
      </div>
      <div className="sp-map-viewport">
        <div className="sp-map-stage" style={{ transform: `scale(${zoom})` }}>
          <MapArt />
          {pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              className="sp-pin"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={() => onSelect(pin.envelopeId)}
            >
              {formatHkd(pin.amount)}
              {pin.extra > 0 ? ` +${pin.extra}` : ''}
            </button>
          ))}
        </div>
      </div>
      {pins.length === 0 && <p className="sp-map-empty">No amounts to pin for this filter.</p>}
    </aside>
  );
}
