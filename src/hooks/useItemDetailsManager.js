import { useState, useEffect } from 'react';
import { uploadImage, deleteImage, updateShoppingItem } from '../lib/firebase';

export const useItemDetailsManager = (items) => {
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState({
    name: '',
    location: '',
    imageUrl: '',
    url: '',
    remarks: '',
    tags: [],
    isBought: false
  });
  const [newTagInput, setNewTagInput] = useState('');
  const [isEditingTag, setIsEditingTag] = useState(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // Extract all unique tags from items for suggestions
  const tagKey = items.map((item) => (item.tags || []).join('\u0001')).join('\u0002');
  useEffect(() => {
    const allTags = Array.from(new Set(items.flatMap(item => item.tags || [])));
    setTagSuggestions(allTags);
  }, [tagKey, items]);

  useEffect(() => {
    if (!selectedItem?.pending) return;
    const fresh = items.find((item) => item.id === selectedItem.id);
    if (fresh && !fresh.pending) {
      setSelectedItem(fresh);
    }
  }, [items, selectedItem]);

  useEffect(() => {
    if (!selectedItem?.id || selectedItem.pending) return;
    const fresh = items.find((item) => item.id === selectedItem.id);
    if (!fresh || fresh.pending) return;
    const freshImage = fresh.imageUrl && !String(fresh.imageUrl).startsWith('blob:') ? fresh.imageUrl : '';
    const selectedImage = selectedItem.imageUrl && !String(selectedItem.imageUrl).startsWith('blob:') ? selectedItem.imageUrl : '';

    setItemDetails((prev) => {
      const next = { ...prev };
      let changed = false;
      if ((prev.name || '') === (selectedItem.name || '') && fresh.name && fresh.name !== prev.name) {
        next.name = fresh.name;
        changed = true;
      }
      if ((prev.imageUrl || '') === selectedImage && freshImage && freshImage !== (prev.imageUrl || '')) {
        next.imageUrl = freshImage;
        changed = true;
      }
      if ((prev.url || '') === (selectedItem.url || '') && (fresh.url || '') !== (prev.url || '')) {
        next.url = fresh.url || '';
        changed = true;
      }
      return changed ? next : prev;
    });

    if (
      fresh.name !== selectedItem.name
      || (fresh.imageUrl || '') !== (selectedItem.imageUrl || '')
      || (fresh.url || '') !== (selectedItem.url || '')
    ) {
      setSelectedItem(fresh);
    }
  }, [items, selectedItem]);

  // Open item details panel with the selected item's data
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setItemDetails({
      name: item.name || '',
      location: item.location || '',
      imageUrl: item.imageUrl || '',
      url: item.url || '',
      remarks: item.remarks || '',
      tags: item.tags || [],
      isBought: item.isBought || false
    });
    setUploadError('');
    setSaveError('');
    setIsDetailsPanelOpen(true);
  };

  // Tag Management Functions
  const handleAddNewTag = (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    
    const newTag = newTagInput.trim();
    setItemDetails(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, newTag])]
    }));
    setNewTagInput('');
  };

  const handleSelectExistingTag = (tag) => {
    if (!itemDetails.tags.includes(tag)) {
      setItemDetails(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setItemDetails(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEditTag = (tag) => {
    setIsEditingTag(tag);
    setEditTagValue(tag);
  };

  const handleUpdateTag = (oldTag, e) => {
    if (e.key === 'Enter' && editTagValue.trim()) {
      const newTag = editTagValue.trim();
      setItemDetails(prev => ({
        ...prev,
        tags: prev.tags.map(tag => 
          tag === oldTag ? newTag : tag
        )
      }));
      setIsEditingTag(null);
    } else if (e.key === 'Escape') {
      setIsEditingTag(null);
    }
  };

  // Handle keyboard events for tag input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag(e);
    }
  };

  // Image upload handling
  const handleImageUpload = async (file, item) => {
    // If file is null, we want to delete the image
    if (!file && item) {
      setIsUploading(true);
      setUploadError('');
      
      try {
        if (itemDetails.imageUrl) {
          await deleteImage(itemDetails.imageUrl);
          setItemDetails(prev => ({ ...prev, imageUrl: '' }));
          // Make sure we have a valid item ID
          if (item && item.id) {
            await updateShoppingItem(item.id, { imageUrl: '' });
          } else {
            throw new Error('Invalid item or item ID for image deletion');
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        setUploadError('Failed to delete image');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!file || !item || !item.id) {
      console.error('Missing file, item, or item ID for image upload');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      if (itemDetails.imageUrl) {
        await deleteImage(itemDetails.imageUrl);
      }

      const imageUrl = await uploadImage(file, item.id);
      setItemDetails(prev => ({ ...prev, imageUrl }));
      await updateShoppingItem(item.id, { imageUrl });
      setUploadError('');
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save changes
  const handleUpdateItem = async () => {
    if (!selectedItem || !selectedItem.id || selectedItem.pending) {
      setSaveError(selectedItem?.pending ? 'Still saving. Try again in a moment.' : "Couldn't save changes.");
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      // Create a clean update object with only defined fields
      const updateData = {
        name: itemDetails.name || '',
        location: itemDetails.location || '',
        url: itemDetails.url || '',
        remarks: itemDetails.remarks || '',
        isBought: !!itemDetails.isBought
      };
      
      // Only include imageUrl if it exists
      if (itemDetails.imageUrl) {
        updateData.imageUrl = itemDetails.imageUrl;
      }
      
      // Ensure tags is always an array
      updateData.tags = Array.isArray(itemDetails.tags) ? itemDetails.tags : [];
      
      // Update directly with Firebase
      await updateShoppingItem(selectedItem.id, updateData);
      
      // Close panel after successful update
      setIsDetailsPanelOpen(false);
    } catch (error) {
      console.error('Error updating item:', error);
      setSaveError("Couldn't save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isDetailsPanelOpen,
    selectedItem,
    itemDetails,
    newTagInput,
    isEditingTag,
    editTagValue,
    tagSuggestions,
    isUploading,
    isSaving,
    uploadError,
    saveError,
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
    handleUpdateItem
  };
};