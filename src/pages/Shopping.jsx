import React from 'react';
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
    setShowBoughtItems,
    toggleFilterTag,
    handleAddItem,
    handleDeleteItem,
    toggleItemBought
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
    uploadError
  } = useItemDetailsManager(items);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold">Shopping List</h1>
        </header>
        
        <main className="space-y-6">
          <AddItemForm onAddItem={handleAddItem} />
          
          <FilterBar 
            showBoughtItems={showBoughtItems}
            setShowBoughtItems={setShowBoughtItems}
            allTags={allTags}
            selectedFilterTags={selectedFilterTags}
            toggleFilterTag={toggleFilterTag}
          />

          <ShoppingList
            items={filteredItems}
            onItemClick={handleItemClick}
            onDeleteItem={handleDeleteItem}
            onToggleBought={toggleItemBought}
          />
        </main>
      </div>

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
        uploadError={uploadError}
      />
    </div>
  );
};

export default Shopping;
