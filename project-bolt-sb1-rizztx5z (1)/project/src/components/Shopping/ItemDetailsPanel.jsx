import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Hash, Plus } from 'lucide-react';
import TagList from './TagList';

const ItemDetailsPanel = ({
  isOpen,
  setIsOpen,
  item,
  itemDetails,
  setItemDetails,
  onUpdateItem,
  newTagInput,
  setNewTagInput,
  isEditingTag,
  setIsEditingTag,
  editTagValue,
  setEditTagValue,
  tagSuggestions,
  onAddNewTag,
  onSelectExistingTag,
  onRemoveTag,
  onEditTag,
  onUpdateTag,
  onKeyDown,
  onImageUpload,
  isUploading,
  uploadError
}) => {
  if (!item) return null;

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-50"
        onClose={setIsOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl border-l border-white/10">
                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <Dialog.Title className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                      Item Details
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={itemDetails.name}
                        onChange={(e) => setItemDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="block w-full bg-gray-800/70 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                        placeholder="Item name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={itemDetails.location}
                        onChange={(e) => setItemDetails(prev => ({ ...prev, location: e.target.value }))}
                        className="block w-full bg-gray-800/70 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                        placeholder="Where to buy?"
                      />
                    </div>

                    <ImageUploadSection 
                      itemDetails={itemDetails}
                      setItemDetails={setItemDetails}
                      onImageUpload={onImageUpload}
                      isUploading={isUploading}
                      uploadError={uploadError}
                      item={item}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Product URL
                      </label>
                      <input
                        type="text"
                        value={itemDetails.url}
                        onChange={(e) => setItemDetails(prev => ({ ...prev, url: e.target.value }))}
                        className="block w-full bg-gray-800/70 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                        placeholder="https://example.com/product"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Remarks
                      </label>
                      <textarea
                        value={itemDetails.remarks}
                        onChange={(e) => setItemDetails(prev => ({ ...prev, remarks: e.target.value }))}
                        rows={3}
                        className="block w-full bg-gray-800/70 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-all duration-300"
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <TagList
                      itemDetails={itemDetails}
                      newTagInput={newTagInput}
                      setNewTagInput={setNewTagInput}
                      isEditingTag={isEditingTag}
                      setIsEditingTag={setIsEditingTag}
                      editTagValue={editTagValue}
                      setEditTagValue={setEditTagValue}
                      tagSuggestions={tagSuggestions}
                      onAddNewTag={onAddNewTag}
                      onSelectExistingTag={onSelectExistingTag}
                      onRemoveTag={onRemoveTag}
                      onEditTag={onEditTag}
                      onUpdateTag={onUpdateTag}
                      onKeyDown={onKeyDown}
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 p-4">
                  <button
                    type="button"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg font-medium"
                    onClick={onUpdateItem}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

const ImageUploadSection = ({ 
  itemDetails, 
  setItemDetails, 
  onImageUpload, 
  isUploading, 
  uploadError,
  item
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Image
      </label>
      <div className="space-y-4">
        {itemDetails.imageUrl && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden shadow-lg border border-white/10">
            <img
              src={itemDetails.imageUrl}
              alt="Item"
              className="w-full h-full object-cover"
            />
            <button
              onClick={async () => {
                try {
                  onImageUpload(null, item);
                } catch (error) {
                  console.error('Error deleting image:', error);
                }
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              disabled={isUploading}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="flex flex-col items-center">
          <label className={`w-full flex flex-col items-center px-4 py-6 bg-white/5 text-gray-300 rounded-lg cursor-pointer hover:bg-white/10 transition-all border border-white/10 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm">
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF or WEBP (max. 5MB)
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file, item);
                }
              }}
              disabled={isUploading}
            />
          </label>

          {uploadError && (
            <p className={`mt-2 text-sm ${
              uploadError.includes('successfully') 
                ? 'text-emerald-400' 
                : 'text-red-400'
            }`}>
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPanel;