import React, { useEffect, useRef, useState } from 'react';
import { parseCapture } from '../../lib/shoppingCapture';

const AddItemForm = ({ onAddItem, error, onClearError }) => {
  const [newItem, setNewItem] = useState('');
  const inputRef = useRef(null);
  const saving = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving.current) return;

    const parsed = parseCapture(newItem);
    if (!parsed) return;

    const typed = newItem;
    setNewItem('');
    saving.current = true;
    const saved = await onAddItem(parsed);
    saving.current = false;
    if (!saved) setNewItem(typed);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="shop-capture flex items-center gap-4">
        <label htmlFor="shopping-capture" className="sr-only">
          Save something
        </label>
        <input
          id="shopping-capture"
          ref={inputRef}
          type="text"
          value={newItem}
          autoFocus
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="done"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'shopping-capture-error' : undefined}
          onChange={(event) => {
            setNewItem(event.target.value);
            if (error) onClearError();
          }}
          placeholder="Save it before you forget."
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-neutral-100 placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
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
    </form>
  );
};

export default AddItemForm;
