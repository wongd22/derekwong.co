import React from 'react';
import { Star } from 'lucide-react';
import { formatHkd } from '../../../shared/spending/format.js';

export default function ListingCard({ item, layout }) {
  const width = item.written ? Math.min(100, (item.spent / item.written) * 100) : 0;
  return (
    <article className={`sp-card ${layout === 'grid' ? 'is-grid' : ''}`}>
      <div className={`sp-swatch tone-${item.tone}`} aria-hidden="true" />
      <div>
        <p className="sp-eyebrow">{item.roleLabel}</p>
        <h3>{item.title}</h3>
        <p className="sp-stat">
          <Star size={14} aria-hidden="true" />
          <span>{item.entries === 1 ? '1 entry' : `${item.entries} entries`}</span>
        </p>
        <p className="sp-meta">
          {item.lastLoggedLabel ? `Last logged ${item.lastLoggedLabel}` : 'No entries yet'}
          {' · '}
          {item.source === 'wellOn' ? 'Well On' : 'Personal'}
        </p>
        {item.categories.length > 0 && (
          <p className="sp-cats">{item.categories.map((category) => category.name).join(' · ')}</p>
        )}
        {item.written != null && (
          <div className="sp-bar" aria-hidden="true">
            <span className={item.overWritten ? 'is-over' : ''} style={{ width: `${width}%` }} />
          </div>
        )}
        <p className="sp-blurb">{item.blurb}</p>
      </div>
      <div className="sp-price">
        {item.overWritten && <span className="sp-flag">Over written</span>}
        <strong>{formatHkd(item.spent)}</strong>
        {item.fullSpent != null && <span>{`Full ${formatHkd(item.fullSpent)}`}</span>}
      </div>
    </article>
  );
}
