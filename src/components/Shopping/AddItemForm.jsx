import React, { useEffect, useMemo, useRef } from 'react';
import { parseCapture } from '../../lib/shoppingCapture';
import { matchSavedItems } from '../../lib/shoppingFind';

const AddItemForm = ({
  value,
  onChange,
  onAddItem,
  onRevealItem,
  items,
  error,
  onClearError
}) => {
  const inputRef = useRef(null);
  const saving = useRef(false);
  const matches = useMemo(() => matchSavedItems(items, value), [items, value]);
  const exact = matches.some((item) => item.name?.trim().toLowerCase() === value.trim().toLowerCase());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving.current) return;

    const parsed = parseCapture(value);
    if (!parsed) return;

    const typed = value;
    onChange('');
    saving.current = true;
    const saved = await onAddItem(parsed);
    saving.current = false;
    if (!saved) onChange(typed);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="shop-capture flex items-center gap-4">
        <label htmlFor="shopping-capture" className="sr-only">
          Save something. Paste or drop a link or photo to save it here.
        </label>
        <input
          id="shopping-capture"
          ref={inputRef}
          type="text"
          value={value}
          autoFocus
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="done"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'shopping-capture-error' : matches.length ? 'saved-matches-label' : undefined}
          onChange={(event) => {
            onChange(event.target.value);
            if (error) onClearError();
          }}
          placeholder="Save it before you forget."
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-neutral-100 placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 rounded-sm text-sm font-medium text-[#e4c9a3] disabled:text-neutral-700"
        >
          Save
        </button>
      </div>
      {error && (
        <p id="shopping-capture-error" role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {matches.length > 0 && (
        <div className="mt-3">
          <p id="saved-matches-label" className="text-xs text-neutral-500">Already saved</p>
          <ul className="mt-1" aria-labelledby="saved-matches-label">
            {matches.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onRevealItem(item)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-sm py-2 text-left"
                >
                  <span className={`truncate text-sm ${item.isBought ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                    {item.name}
                  </span>
                  {item.isBought && <span className="shrink-0 text-xs text-neutral-600">Bought</span>}
                </button>
              </li>
            ))}
          </ul>
          {exact && (
            <p className="text-xs text-neutral-600">Enter saves a new one.</p>
          )}
        </div>
      )}
    </form>
  );
};

export default AddItemForm;
