import { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeToShoppingList,
  stageShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  deleteImage
} from '../lib/firebase';
import { buildShoppingView } from '../lib/shoppingView';

const UNDO_MS = 30000;

async function removeStoredItem(item) {
  if (item?.imageUrl) {
    await deleteImage(item.imageUrl);
  }
  await deleteShoppingItem(item.id);
}

export const useShoppingListManager = () => {
  const [serverItems, setServerItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showBoughtItems, setShowBoughtItems] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [optimisticItems, setOptimisticItems] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [addError, setAddError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const pendingWrites = useRef(new Map());
  const cancelledIds = useRef(new Set());
  const pendingDeleteRef = useRef(null);
  const undoTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToShoppingList((nextItems) => {
      setServerItems(nextItems);
      setIsLoading(false);
      setLoadError('');
    }, () => {
      setIsLoading(false);
      setLoadError("Couldn't load your list.");
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    setOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of serverItems) {
        const patch = next[item.id];
        if (!patch) continue;
        const matches = Object.entries(patch).every(([key, value]) => item[key] === value);
        if (matches) {
          delete next[item.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    setOptimisticItems((prev) => {
      if (prev.length === 0) return prev;
      const serverIds = new Set(serverItems.map((item) => item.id));
      const next = prev.filter((item) => !serverIds.has(item.id));
      return next.length === prev.length ? prev : next;
    });

    setHiddenIds((prev) => {
      if (prev.size === 0) return prev;
      const serverIds = new Set(serverItems.map((item) => item.id));
      const next = new Set([...prev].filter((id) => serverIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [serverItems]);

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const pending = pendingDeleteRef.current;
    pendingDeleteRef.current = null;
    if (!pending?.item || pending.item.pending) return;
    removeStoredItem(pending.item).catch((error) => {
      console.error('Error deleting item:', error);
    });
  }, []);

  const view = useMemo(() => buildShoppingView({
    serverItems,
    optimisticItems,
    overrides,
    hiddenIds,
    showBoughtItems,
    selectedFilterTags
  }), [serverItems, optimisticItems, overrides, hiddenIds, showBoughtItems, selectedFilterTags]);

  const clearAddError = () => setAddError('');

  const finishPendingDelete = () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    removeStoredItem(pending.item).catch((error) => {
      console.error('Error deleting item:', error);
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(pending.item.id);
        return next;
      });
      setActionError("Couldn't delete that. It's still here.");
    });
  };

  const handleAddItem = async (input) => {
    const name = (typeof input === 'string' ? input : input?.name || '').trim();
    const url = (typeof input === 'string' ? '' : input?.url || '').trim();
    if (!name) return false;

    setAddError('');
    setActionError('');
    setSelectedFilterTags([]);

    const staged = stageShoppingItem({
      name,
      location: '',
      imageUrl: '',
      url,
      remarks: '',
      tags: [],
      isBought: false
    });

    pendingWrites.current.set(staged.id, staged.item);
    setOptimisticItems((prev) => [{ id: staged.id, ...staged.item, pending: true }, ...prev]);

    try {
      const latest = pendingWrites.current.get(staged.id) || staged.item;
      await staged.commit(latest);
      pendingWrites.current.delete(staged.id);
      if (cancelledIds.current.has(staged.id)) {
        cancelledIds.current.delete(staged.id);
        await deleteShoppingItem(staged.id);
        setOptimisticItems((prev) => prev.filter((item) => item.id !== staged.id));
      }
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      pendingWrites.current.delete(staged.id);
      cancelledIds.current.delete(staged.id);
      setOptimisticItems((prev) => prev.filter((item) => item.id !== staged.id));
      setAddError("Couldn't save that. Try again.");
      return false;
    }
  };

  const handleDeleteItem = (id) => {
    const item = [...optimisticItems, ...serverItems].find((entry) => entry.id === id);
    if (!item) return;
    if (pendingDeleteRef.current?.item?.id === id) return;

    if (item.pending || pendingWrites.current.has(id)) {
      cancelledIds.current.add(id);
      pendingWrites.current.delete(id);
      setOptimisticItems((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }

    finishPendingDelete();
    setActionError('');
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const entry = { item };
    pendingDeleteRef.current = entry;
    setPendingDelete(entry);
    undoTimer.current = setTimeout(() => {
      pendingDeleteRef.current = null;
      undoTimer.current = null;
      setPendingDelete(null);
      removeStoredItem(item).catch((error) => {
        console.error('Error deleting item:', error);
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setActionError("Couldn't delete that. It's still here.");
      });
    }, UNDO_MS);
  };

  const undoDelete = () => {
    const entry = pendingDeleteRef.current;
    if (!entry) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(entry.item.id);
      return next;
    });
  };

  const toggleItemBought = async (item) => {
    const nextBought = !item.isBought;
    setActionError('');

    if (item.pending || pendingWrites.current.has(item.id)) {
      const current = pendingWrites.current.get(item.id);
      if (current) {
        pendingWrites.current.set(item.id, { ...current, isBought: nextBought });
      }
      setOptimisticItems((prev) => prev.map((entry) => (
        entry.id === item.id ? { ...entry, isBought: nextBought } : entry
      )));
      return;
    }

    setOverrides((prev) => ({ ...prev, [item.id]: { ...prev[item.id], isBought: nextBought } }));
    try {
      await updateShoppingItem(item.id, { isBought: nextBought });
    } catch (error) {
      console.error('Error toggling item status:', error);
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setActionError("Couldn't update that. It's unchanged.");
    }
  };

  const toggleFilterTag = (tag) => {
    setSelectedFilterTags((prev) => (
      prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag]
    ));
  };

  return {
    items: view.items,
    filteredItems: view.filteredItems,
    showBoughtItems,
    selectedFilterTags,
    allTags: view.allTags,
    boughtCount: view.boughtCount,
    isLoading,
    loadError,
    addError,
    actionError,
    pendingDelete,
    setShowBoughtItems,
    toggleFilterTag,
    handleAddItem,
    handleDeleteItem,
    undoDelete,
    toggleItemBought,
    clearAddError
  };
};
