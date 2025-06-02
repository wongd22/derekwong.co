import { useState, useEffect } from 'react';
import { 
  subscribeToShoppingList, 
  addShoppingItem, 
  updateShoppingItem, 
  deleteShoppingItem,
  deleteImage
} from '../lib/firebase';

export const useShoppingListManager = () => {
  const [items, setItems] = useState([]);
  const [showBoughtItems, setShowBoughtItems] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToShoppingList((newItems) => {
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  // Get all unique tags from all items
  const allTags = Array.from(new Set(items.flatMap(item => item.tags || [])));

  // Filter items based on user-selected filters
  const filteredItems = items
    .filter(item => showBoughtItems ? true : !item.isBought)
    .filter(item => 
      selectedFilterTags.length === 0 || 
      selectedFilterTags.every(tag => item.tags?.includes(tag))
    );

  // Toggle a specific filter tag
  const toggleFilterTag = (tag) => {
    setSelectedFilterTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Add a new shopping item
  const handleAddItem = async (name) => {
    if (!name.trim()) return;

    const newItemData = {
      name,
      location: '',
      imageUrl: '',
      url: '',
      remarks: '',
      tags: [],
      isBought: false
    };

    try {
      await addShoppingItem(newItemData);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Delete a shopping item and its image if it exists
  const handleDeleteItem = async (id) => {
    try {
      const item = items.find(item => item.id === id);
      if (item?.imageUrl) {
        await deleteImage(item.imageUrl);
      }
      await deleteShoppingItem(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Toggle the 'bought' status of an item
  const toggleItemBought = async (item) => {
    try {
      await updateShoppingItem(item.id, { isBought: !item.isBought });
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  return {
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
  };
};