import React from 'react';
import { Hash, X, Plus } from 'lucide-react';

const TagList = ({
  itemDetails,
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
  onKeyDown
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Tags
      </label>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {itemDetails.tags && itemDetails.tags.map((tag) => (
            <div
              key={tag}
              className="group flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10 transition-all duration-300 hover:border-white/20"
            >
              <Hash className="w-3 h-3 text-blue-300" />
              {isEditingTag === tag ? (
                <input
                  type="text"
                  value={editTagValue}
                  onChange={(e) => setEditTagValue(e.target.value)}
                  onKeyDown={(e) => onUpdateTag(tag, e)}
                  onBlur={() => setIsEditingTag(null)}
                  className="bg-transparent border-none p-0 text-sm text-white focus:ring-0 w-20"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => onEditTag(tag)}
                  className="text-sm text-gray-300 cursor-text"
                >
                  {tag}
                </span>
              )}
              <button
                onClick={() => onRemoveTag(tag)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {tagSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tagSuggestions
              .filter(tag => !itemDetails.tags.includes(tag))
              .map(tag => (
                <button
                  key={tag}
                  onClick={() => onSelectExistingTag(tag)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 hover:bg-white/10 text-sm text-gray-400 hover:text-gray-200"
                >
                  <Plus className="w-3 h-3" />
                  {tag}
                </button>
              ))}
          </div>
        )}

        <form onSubmit={onAddNewTag} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <Hash className="w-4 h-4 text-blue-300" />
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add a tag..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-400 focus:ring-0 focus:outline-none p-0"
          />
        </form>
      </div>
    </div>
  );
};

export default TagList;