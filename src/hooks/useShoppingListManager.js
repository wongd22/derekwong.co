import { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeToShoppingList,
  stageShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  deleteImage,
  uploadImage
} from '../lib/firebase';
import { buildShoppingView } from '../lib/shoppingView';
import { isPlaceholderName, nameFromFile, prepareCaptureFile } from '../lib/shoppingCapture';
import { fetchLinkPreview, followUpUpdates, previewUpdates } from '../lib/shoppingPreview';

const UNDO_MS = 30000;

export const useShoppingListManager = () => {
  const [serverItems, setServerItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showBoughtItems, setShowBoughtItems] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [optimisticItems, setOptimisticItems] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [localImages, setLocalImages] = useState({});
  const [addError, setAddError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingBought, setPendingBought] = useState(null);

  const pendingWrites = useRef(new Map());
  const cancelledIds = useRef(new Set());
  const voidIds = useRef(new Set());
  const pendingDeleteRef = useRef(null);
  const pendingBoughtRef = useRef(null);
  const undoTimer = useRef(null);
  const boughtTimer = useRef(null);
  const autoNames = useRef(new Map());
  const knownItems = useRef(new Map());
  const ownPhotos = useRef(new Set());
  const localImagesRef = useRef({});
  const serverItemsRef = useRef(serverItems);
  const overridesRef = useRef(overrides);
  const mounted = useRef(true);
  const writeBoughtRef = useRef(() => {});

  serverItemsRef.current = serverItems;
  overridesRef.current = overrides;

  const setLocal = (next) => {
    localImagesRef.current = next;
    if (mounted.current) setLocalImages(next);
  };

  const releaseLocal = (id) => {
    const url = localImagesRef.current[id];
    if (!url) return;
    URL.revokeObjectURL(url);
    const next = { ...localImagesRef.current };
    delete next[id];
    setLocal(next);
  };

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

  useEffect(() => {
    setLocalImages((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [id, url] of Object.entries(prev)) {
        const server = serverItems.find((item) => item.id === id);
        const image = overrides[id]?.imageUrl || server?.imageUrl;
        if (image && !String(image).startsWith('blob:')) {
          URL.revokeObjectURL(url);
          delete next[id];
          changed = true;
        }
      }
      if (!changed) return prev;
      localImagesRef.current = next;
      return next;
    });
  }, [serverItems, overrides]);

  const removeStoredItem = async (item) => {
    voidIds.current.add(item.id);
    try {
      if (item?.imageUrl) await deleteImage(item.imageUrl);
      await deleteShoppingItem(item.id);
    } catch (error) {
      voidIds.current.delete(item.id);
      throw error;
    }
  };

  useEffect(() => () => {
    mounted.current = false;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (boughtTimer.current) clearTimeout(boughtTimer.current);
    const pending = pendingDeleteRef.current;
    pendingDeleteRef.current = null;
    if (pending?.item && !pending.item.pending) {
      removeStoredItem(pending.item).catch((error) => {
        console.error('Error deleting item:', error);
      });
    }
    const bought = pendingBoughtRef.current;
    pendingBoughtRef.current = null;
    if (bought && !bought.cancelled) writeBoughtRef.current(bought);
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
    if (mounted.current) setPendingDelete(null);
    removeStoredItem(pending.item).catch((error) => {
      console.error('Error deleting item:', error);
      if (!mounted.current) return;
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(pending.item.id);
        return next;
      });
      setActionError("Couldn't delete that. It's still here.");
    });
  };

  const setBoughtFlag = (id, isBought) => {
    setOptimisticItems((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, isBought } : entry
    )));
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], isBought } }));
  };

  const writeBought = (entry) => {
    if (!entry || entry.cancelled || voidIds.current.has(entry.id) || cancelledIds.current.has(entry.id)) return;
    if (pendingWrites.current.has(entry.id)) {
      const current = pendingWrites.current.get(entry.id);
      pendingWrites.current.set(entry.id, { ...current, isBought: true });
      if (mounted.current) {
        setOptimisticItems((prev) => prev.map((item) => (
          item.id === entry.id ? { ...item, isBought: true } : item
        )));
      }
      return;
    }
    updateShoppingItem(entry.id, { isBought: true }).catch((error) => {
      console.error('Error toggling item status:', error);
      if (!mounted.current) return;
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
      setActionError("Couldn't update that. It's unchanged.");
    });
  };
  writeBoughtRef.current = writeBought;

  const finishPendingBought = () => {
    const entry = pendingBoughtRef.current;
    if (!entry) return;
    if (boughtTimer.current) clearTimeout(boughtTimer.current);
    boughtTimer.current = null;
    pendingBoughtRef.current = null;
    if (mounted.current) setPendingBought(null);
    if (!entry.cancelled) writeBought(entry);
  };

  const undoBought = () => {
    const entry = pendingBoughtRef.current;
    if (!entry) return;
    entry.cancelled = true;
    if (boughtTimer.current) clearTimeout(boughtTimer.current);
    boughtTimer.current = null;
    pendingBoughtRef.current = null;
    setPendingBought(null);
    setBoughtFlag(entry.id, false);
  };

  const beginBought = (item) => {
    if (pendingBoughtRef.current?.id === item.id) return;
    finishPendingBought();
    const entry = { id: item.id, name: item.name || 'This item', cancelled: false };
    pendingBoughtRef.current = entry;
    setPendingBought(entry);
    setBoughtFlag(item.id, true);
    boughtTimer.current = setTimeout(() => {
      if (pendingBoughtRef.current !== entry || entry.cancelled) return;
      pendingBoughtRef.current = null;
      boughtTimer.current = null;
      setPendingBought(null);
      writeBought(entry);
    }, UNDO_MS);
  };

  const currentItem = (id) => {
    const pending = pendingWrites.current.get(id);
    if (pending) return pending;
    const server = serverItemsRef.current.find((item) => item.id === id);
    if (server) {
      knownItems.current.delete(id);
      return { ...server, ...overridesRef.current[id] };
    }
    return knownItems.current.get(id) || null;
  };

  const applyPreview = async (id, preview) => {
    if (cancelledIds.current.has(id) || voidIds.current.has(id)) return;
    const current = currentItem(id);
    if (!current) return;
    const updates = previewUpdates({
      name: current.name,
      imageUrl: current.imageUrl || '',
      autoName: autoNames.current.get(id) || current.name,
      preview,
      keepImage: ownPhotos.current.has(id) || Boolean(localImagesRef.current[id])
    });
    if (!updates) return;

    const pending = pendingWrites.current.get(id);
    if (pending) pendingWrites.current.set(id, { ...pending, ...updates });
    if (knownItems.current.has(id)) {
      knownItems.current.set(id, { ...knownItems.current.get(id), ...updates });
    }
    if (mounted.current) {
      setOptimisticItems((prev) => prev.map((item) => (
        item.id === id ? { ...item, ...updates } : item
      )));
      if (!pending) {
        setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
      }
    }
    if (pending) return;
    try {
      await updateShoppingItem(id, updates);
    } catch (error) {
      console.error('Error updating link preview:', error);
    }
  };

  const attachFile = (id, file) => {
    uploadImage(file, id).then(async (imageUrl) => {
      if (voidIds.current.has(id) || cancelledIds.current.has(id)) return;
      if (mounted.current) {
        setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], imageUrl } }));
      }
      await updateShoppingItem(id, { imageUrl });
    }).catch((error) => {
      console.error('Error uploading image:', error);
      releaseLocal(id);
      ownPhotos.current.delete(id);
      if (mounted.current) setActionError("Saved it. The photo didn't attach.");
    });
  };

  const handleAddItem = async (input) => {
    const incomingFile = typeof input === 'string' ? null : input?.file || null;
    const url = (typeof input === 'string' ? '' : input?.url || '').trim();
    let name = (typeof input === 'string' ? input : input?.name || '').trim();
    if (!name && incomingFile) name = nameFromFile(incomingFile);
    if (!name) return false;

    const prepared = incomingFile ? prepareCaptureFile(incomingFile) : { file: null, problem: '' };
    const problem = prepared.problem || (typeof input === 'string' ? '' : input?.problem || '');

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

    autoNames.current.set(staged.id, isPlaceholderName(name, url) ? name : '');
    if (prepared.file) ownPhotos.current.add(staged.id);

    if (prepared.file) {
      const localUrl = URL.createObjectURL(prepared.file);
      setLocal({ ...localImagesRef.current, [staged.id]: localUrl });
    }

    pendingWrites.current.set(staged.id, staged.item);
    setOptimisticItems((prev) => [{ id: staged.id, ...staged.item, pending: true }, ...prev]);

    if (url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      fetchLinkPreview(url, { signal: controller.signal })
        .then((preview) => applyPreview(staged.id, preview))
        .catch(() => {})
        .finally(() => clearTimeout(timer));
    }

    try {
      const written = { ...(pendingWrites.current.get(staged.id) || staged.item) };
      await staged.commit(written);
      const after = pendingWrites.current.get(staged.id) || written;
      pendingWrites.current.delete(staged.id);
      knownItems.current.set(staged.id, { ...after });

      if (cancelledIds.current.has(staged.id)) {
        cancelledIds.current.delete(staged.id);
        knownItems.current.delete(staged.id);
        releaseLocal(staged.id);
        await deleteShoppingItem(staged.id);
        if (mounted.current) {
          setOptimisticItems((prev) => prev.filter((item) => item.id !== staged.id));
        }
        return false;
      }

      const follow = followUpUpdates(written, after);
      if (Object.keys(follow).length) await updateShoppingItem(staged.id, follow);
      if (prepared.file) attachFile(staged.id, prepared.file);
      if (mounted.current && problem === 'size') setActionError('Saved it. The photo is over 5MB.');
      else if (mounted.current && problem === 'photo') setActionError('Saved it. That photo did not attach.');
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      pendingWrites.current.delete(staged.id);
      cancelledIds.current.delete(staged.id);
      releaseLocal(staged.id);
      if (mounted.current) {
        setOptimisticItems((prev) => prev.filter((item) => item.id !== staged.id));
        setAddError("Couldn't save that. Try again.");
      }
      return false;
    }
  };

  const handleDeleteItem = (id) => {
    const item = [...optimisticItems, ...serverItems].find((entry) => entry.id === id);
    if (!item) return;
    if (pendingDeleteRef.current?.item?.id === id) return;

    if (item.pending || pendingWrites.current.has(id)) {
      if (pendingBoughtRef.current?.id === id) {
        pendingBoughtRef.current.cancelled = true;
        if (boughtTimer.current) clearTimeout(boughtTimer.current);
        boughtTimer.current = null;
        pendingBoughtRef.current = null;
        setPendingBought(null);
      }
      cancelledIds.current.add(id);
      pendingWrites.current.delete(id);
      releaseLocal(id);
      setOptimisticItems((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }

    if (pendingBoughtRef.current?.id === id) finishPendingBought();
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

    if (nextBought) {
      beginBought(item);
      return;
    }

    if (pendingBoughtRef.current?.id === item.id) {
      undoBought();
      return;
    }

    if (item.pending || pendingWrites.current.has(item.id)) {
      const current = pendingWrites.current.get(item.id);
      if (current) pendingWrites.current.set(item.id, { ...current, isBought: nextBought });
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
    pendingBought,
    localImages,
    setShowBoughtItems,
    setSelectedFilterTags,
    toggleFilterTag,
    handleAddItem,
    handleDeleteItem,
    undoDelete,
    undoBought,
    toggleItemBought,
    clearAddError
  };
};
