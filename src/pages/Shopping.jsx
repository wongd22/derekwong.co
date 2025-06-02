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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="text-center pt-8 pb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-blue-400">
            Shopping List
          </h1>
        </div>
        
        <FilterBar 
          showBoughtItems={showBoughtItems}
          setShowBoughtItems={setShowBoughtItems}
          allTags={allTags}
          selectedFilterTags={selectedFilterTags}
          toggleFilterTag={toggleFilterTag}
        />

        <AddItemForm
          onAddItem={handleAddItem}
        />

        <ShoppingList
          items={filteredItems}
          onItemClick={handleItemClick}
          onDeleteItem={handleDeleteItem}
          onToggleBought={toggleItemBought}
        />
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