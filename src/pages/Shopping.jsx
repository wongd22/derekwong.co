import React, { useCallback, useEffect, useRef, useState } from 'react';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-sans/latin-700.css';
import '../styles/shopping.css';
import ShoppingList from '../components/Shopping/ShoppingList';
import FilterBar from '../components/Shopping/FilterBar';
import AddItemForm from '../components/Shopping/AddItemForm';
import ItemDetailsPanel from '../components/Shopping/ItemDetailsPanel';
import { useShoppingListManager } from '../hooks/useShoppingListManager';
import { useItemDetailsManager } from '../hooks/useItemDetailsManager';
import { useCaptureInbox } from '../hooks/useCaptureInbox';

const Shopping = () => {
  const {
    items,
    filteredItems,
    showBoughtItems,
    selectedFilterTags,
    allTags,
    boughtCount,
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
  } = useShoppingListManager();

  const {
    isDetailsPanelOpen,
    selectedItem,
    itemDetails,
    newTagInput,
    isEditingTag,
    editTagValue,
    tagSuggestions,
    setIsDetailsPanelOpen,
    setItemDetails,
    setNewTagInput,
    setIsEditingTag,
    setEditTagValue,
    handleItemClick,
    handleAddNewTag,
    handleSelectExistingTag,
    handleRemoveTag,
    handleEditTag,
    handleUpdateTag,
    handleKeyDown,
    handleImageUpload,
    handleUpdateItem,
    isUploading,
    isSaving,
    uploadError,
    saveError
  } = useItemDetailsManager(items);

  const [draft, setDraft] = useState('');
  const [foundId, setFoundId] = useState(null);
  const draftRef = useRef('');
  draftRef.current = draft;
  const getDraft = useCallback(() => draftRef.current, []);
  const { dragging, notice } = useCaptureInbox({
    getDraft,
    setDraft,
    onCapture: handleAddItem,
    paused: isDetailsPanelOpen
  });

  useEffect(() => {
    if (!selectedItem) return;
    if (!items.some((item) => item.id === selectedItem.id)) {
      setIsDetailsPanelOpen(false);
    }
  }, [items, selectedItem, setIsDetailsPanelOpen]);

  useEffect(() => {
    if (!foundId) return undefined;
    const timer = setTimeout(() => {
      setFoundId((current) => (current === foundId ? null : current));
    }, 2600);
    return () => clearTimeout(timer);
  }, [foundId]);

  useEffect(() => {
    if (!foundId) return;
    const node = document.querySelector(`[data-item-id="${CSS.escape(foundId)}"]`);
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [foundId, filteredItems, showBoughtItems, selectedFilterTags]);

  const revealItem = (item) => {
    if (item.isBought && !showBoughtItems) setShowBoughtItems(true);
    const hiddenByTags = selectedFilterTags.length > 0
      && !selectedFilterTags.every((tag) => item.tags?.includes(tag));
    if (hiddenByTags) setSelectedFilterTags([]);
    setDraft('');
    setFoundId(item.id);
  };

  const hiddenBecauseTags = selectedFilterTags.length > 0 && filteredItems.length === 0 && items.length > 0;

  return (
    <div className="shopping min-h-screen bg-black text-neutral-100">
      <p className="sr-only" aria-live="polite">{notice}</p>
      {dragging && (
        <div className="pointer-events-none fixed inset-3 z-30 grid place-items-center border border-[#e4c9a3] bg-black">
          <p className="text-sm text-[#e4c9a3]">Drop a link or photo</p>
        </div>
      )}
      <div className="mx-auto max-w-xl px-5 pb-28 pt-4 sm:px-6">
        <header className="pb-8 pt-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Shopping list</h1>
        </header>

        <main>
          <AddItemForm
            value={draft}
            onChange={setDraft}
            onAddItem={handleAddItem}
            onRevealItem={revealItem}
            items={items}
            error={addError}
            onClearError={clearAddError}
          />

          <FilterBar
            showBoughtItems={showBoughtItems}
            setShowBoughtItems={setShowBoughtItems}
            allTags={allTags}
            selectedFilterTags={selectedFilterTags}
            toggleFilterTag={toggleFilterTag}
            boughtCount={boughtCount}
            hasItems={items.length > 0}
          />

          {actionError && (
            <p role="alert" className="mt-4 text-sm text-red-400">{actionError}</p>
          )}

          <ShoppingList
            items={filteredItems}
            hasAnyItems={items.length > 0}
            isLoading={isLoading}
            loadError={loadError}
            hiddenBecauseTags={hiddenBecauseTags}
            onItemClick={handleItemClick}
            onDeleteItem={handleDeleteItem}
            onToggleBought={toggleItemBought}
            localImages={localImages}
            foundId={foundId}
          />
        </main>
      </div>

      {(pendingBought || pendingDelete) && (
        <div className="fixed inset-x-0 bottom-3 z-40 flex flex-col gap-2 px-4">
          {pendingBought && (
            <div
              role="status"
              aria-live="polite"
              className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 border border-white/10 bg-black px-4 py-3"
            >
              <p className="truncate text-sm text-neutral-300">
                Marked {pendingBought.name} bought
              </p>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  undoBought();
                }}
                onClick={undoBought}
                className="shrink-0 rounded-sm px-3 py-2 text-sm font-medium text-[#e4c9a3]"
              >
                Undo
              </button>
            </div>
          )}
          {pendingDelete && (
            <div
              role="status"
              aria-live="polite"
              className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 border border-white/10 bg-black px-4 py-3"
            >
              <p className="truncate text-sm text-neutral-300">
                Removed {pendingDelete.item.name || 'this item'}
              </p>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  undoDelete();
                }}
                onClick={undoDelete}
                className="shrink-0 rounded-sm px-3 py-2 text-sm font-medium text-[#e4c9a3]"
              >
                Undo
              </button>
            </div>
          )}
        </div>
      )}

      <ItemDetailsPanel
        isOpen={isDetailsPanelOpen}
        setIsOpen={setIsDetailsPanelOpen}
        item={selectedItem}
        itemDetails={itemDetails}
        setItemDetails={setItemDetails}
        onUpdateItem={handleUpdateItem}
        newTagInput={newTagInput}
        setNewTagInput={setNewTagInput}
        isEditingTag={isEditingTag}
        setIsEditingTag={setIsEditingTag}
        editTagValue={editTagValue}
        setEditTagValue={setEditTagValue}
        tagSuggestions={tagSuggestions}
        onAddNewTag={handleAddNewTag}
        onSelectExistingTag={handleSelectExistingTag}
        onRemoveTag={handleRemoveTag}
        onEditTag={handleEditTag}
        onUpdateTag={handleUpdateTag}
        onKeyDown={handleKeyDown}
        onImageUpload={handleImageUpload}
        isUploading={isUploading}
        isSaving={isSaving}
        uploadError={uploadError}
        saveError={saveError}
      />
    </div>
  );
};

export default Shopping;
