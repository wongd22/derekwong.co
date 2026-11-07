import React from 'react';
import { formatHkd } from '../../../shared/spending/format.js';

const TYPE_RULES = [
  [/meal|dining|lunch|dinner|coffee|cake/, '#e07a5f'],
  [/transport|taxi|uber|mtr/, '#2f7f86'],
  [/entertain|film|concert/, '#d4922a'],
  [/book/, '#5f8f62'],
  [/family/, '#c46b86'],
  [/cloth|shoe/, '#c46545'],
  [/trip|flight/, '#3e6f9a'],
  [/karen/, '#c9897a'],
  [/groc|park|shop|taobao|超市/, '#7d9a46'],
  [/cat|洗冷氣/, '#8a6a4a'],
  [/管理費|電費|差餉|水費|煤氣|parking|hkt|netvigator|townplace|fee/, '#8a8175'],
];

export function typeColor(name) {
  const key = String(name || '').toLowerCase();
  const found = TYPE_RULES.find(([pattern]) => pattern.test(key));
  if (found) return found[1];
  let hash = 0;
  for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 42% 62%)`;
}

export default function ListingCard({ item, layout }) {
  const width = item.written ? Math.min(100, (item.spent / item.written) * 100) : 0;
  return (
    <article className={`sp-card tone-${item.tone} ${layout === 'grid' ? 'is-grid' : ''}`}>
      <div className="sp-stripe" aria-hidden="true" />
      <div className="sp-card-body">
        <div className="sp-card-head">
          <div>
            <p className="sp-eyebrow">{item.roleLabel}</p>
            <h3>{item.title}</h3>
          </div>
          <div className="sp-price">
            {item.overWritten && <span className="sp-flag">Over written</span>}
            <strong>{formatHkd(item.spent)}</strong>
            {item.fullSpent != null && <span>{`Full ${formatHkd(item.fullSpent)}`}</span>}
          </div>
        </div>
        <p className="sp-meta">
          {item.entries === 1 ? '1 entry' : `${item.entries} entries`}
          {' · '}
          {item.lastLoggedLabel ? `Last logged ${item.lastLoggedLabel}` : 'No entries yet'}
          {' · '}
          {item.source === 'wellOn' ? 'Well On' : 'Personal'}
        </p>
        {item.categories.length > 0 && (
          <div className="sp-types">
            {item.categories.map((category) => (
              <span key={category.name} className="sp-type" style={{ background: typeColor(category.name) }}>
                {category.name}
              </span>
            ))}
          </div>
        )}
        {item.written != null && (
          <div className="sp-compose" aria-hidden="true">
            <span className={item.overWritten ? 'is-over' : ''} style={{ width: `${width}%` }} />
          </div>
        )}
        <p className="sp-blurb">{item.blurb}</p>
      </div>
    </article>
  );
}
