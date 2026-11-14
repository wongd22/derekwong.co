import React, { useEffect } from 'react';
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
    setShowBoughtItems,
    toggleFilterTag,
    handleAddItem,
    handleDeleteItem,
    undoDelete,
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

  useEffect(() => {
    if (!selectedItem) return;
    if (!items.some((item) => item.id === selectedItem.id)) {
      setIsDetailsPanelOpen(false);
    }
  }, [items, selectedItem, setIsDetailsPanelOpen]);

  const hiddenBecauseTags = selectedFilterTags.length > 0 && filteredItems.length === 0 && items.length > 0;

  return (
    <div className="shopping min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-xl px-5 pb-28 pt-4 sm:px-6">
        <header className="pb-8 pt-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Shopping list</h1>
        </header>

        <main>
          <AddItemForm
            onAddItem={handleAddItem}
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
          />
        </main>
      </div>

      {pendingDelete && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-3 z-40 px-4"
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4 border border-white/10 bg-black px-4 py-3">
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
