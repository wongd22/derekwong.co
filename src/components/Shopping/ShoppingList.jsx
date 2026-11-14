import React, { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const ShoppingList = ({
  items,
  hasAnyItems,
  isLoading,
  loadError,
  hiddenBecauseTags,
  onItemClick,
  onDeleteItem,
  onToggleBought
}) => {
  if (isLoading && !hasAnyItems) {
    return <p className="pt-12 text-sm text-neutral-500">Loading…</p>;
  }

  if (loadError && !hasAnyItems) {
    return (
      <p role="alert" className="pt-12 text-sm text-red-400">
        {loadError}
      </p>
    );
  }

  if (items.length === 0) {
    if (!hasAnyItems) {
      return (
        <div className="pt-14">
          <p className="text-base font-medium text-neutral-100">Nothing saved yet</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500">
            The lamp, the jacket, the thing from yesterday. A name is enough.
          </p>
        </div>
      );
    }

    return (
      <p className="pt-12 text-sm text-neutral-500">
        {hiddenBecauseTags ? 'Nothing with these tags.' : 'Everything here is bought.'}
      </p>
    );
  }

  return (
    <ul className="mt-4">
      {items.map((item) => (
        <ShoppingRow
          key={item.id}
          item={item}
          onItemClick={onItemClick}
          onDeleteItem={onDeleteItem}
          onToggleBought={onToggleBought}
        />
      ))}
    </ul>
  );
};

const ShoppingRow = ({ item, onItemClick, onDeleteItem, onToggleBought }) => {
  const [revealed, setRevealed] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const rowRef = useRef(null);
  const touch = useRef(null);
  const showImage = Boolean(item.imageUrl) && !imageBroken;

  useEffect(() => {
    if (!revealed) return undefined;

    const close = (event) => {
      if (rowRef.current?.contains(event.target)) return;
      setRevealed(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setRevealed(false);
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [revealed]);

  const onTouchStart = (event) => {
    if (event.target.closest('button, a, input, textarea')) return;
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  };

  const onTouchEnd = (event) => {
    if (!touch.current) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    setRevealed(dx < 0);
  };

  return (
    <li
      ref={rowRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={clsx(
        'item-row border-b border-white/[0.08] py-3.5',
        item.pending && 'shopping-enter opacity-80',
        revealed && 'is-revealed'
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(item.isBought)}
          aria-label={item.isBought ? `${item.name}, bought` : `${item.name}, to buy`}
          onClick={() => onToggleBought(item)}
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full"
        >
          <span
            className={clsx(
              'grid size-5 place-items-center rounded-full transition-colors duration-150',
              item.isBought
                ? 'bg-[#e4c9a3] text-black'
                : 'border border-white/25 text-transparent'
            )}
          >
            <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </button>

        <div className="min-w-0 flex-1 pt-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className={clsx(
                  'block max-w-full text-left text-base font-medium leading-snug',
                  item.isBought ? 'text-neutral-500 line-through' : 'text-neutral-100'
                )}
              >
                <span className="line-clamp-2 break-words">{item.name}</span>
              </button>
              {item.location && (
                <p className="mt-1 truncate text-sm text-neutral-500">{item.location}</p>
              )}
              {item.tags?.length > 0 && (
                <p className="mt-1 truncate text-xs text-neutral-500">{item.tags.join(' · ')}</p>
              )}
            </div>

            <div className="-mt-2 flex shrink-0 items-center">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${item.name}`}
                  className="grid size-11 place-items-center rounded-sm text-neutral-500 hover:text-neutral-100"
                >
                  <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </a>
              )}
              <div className="item-actions">
                <button
                  type="button"
                  aria-label={`Edit ${item.name}`}
                  onClick={() => {
                    setRevealed(false);
                    onItemClick(item);
                  }}
                  className="grid size-11 place-items-center rounded-sm text-neutral-500 hover:text-neutral-100"
                >
                  <Pencil className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => {
                    setRevealed(false);
                    onDeleteItem(item.id);
                  }}
                  className="grid size-11 place-items-center rounded-sm text-neutral-500 hover:text-red-300"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="item-more size-11 items-center justify-center rounded-sm text-neutral-500 hover:text-neutral-100"
                aria-label={`More actions for ${item.name}`}
                aria-expanded={revealed}
                aria-haspopup="true"
                onClick={() => setRevealed((open) => !open)}
              >
                <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
          {showImage && (
            <button
              type="button"
              onClick={() => onItemClick(item)}
              className="mt-3 block w-full rounded-[6px]"
              aria-label={`Photo of ${item.name}`}
            >
              <img
                src={item.imageUrl}
                alt=""
                onError={() => setImageBroken(true)}
                className={clsx(
                  'aspect-[4/3] w-full rounded-[6px] object-cover',
                  item.isBought && 'opacity-50'
                )}
              />
            </button>
          )}
        </div>
      </div>
    </li>
  );
};

export default ShoppingList;
