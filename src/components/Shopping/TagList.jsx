import React from 'react';
import { X } from 'lucide-react';

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
  const tags = itemDetails.tags || [];
  const suggestions = tagSuggestions.filter((tag) => !tags.includes(tag));

  return (
    <div>
      <p className="text-xs text-neutral-500">Tags</p>
      <div className="mt-2 space-y-3">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag} className="flex items-center gap-1 text-sm text-neutral-300">
                {isEditingTag === tag ? (
                  <input
                    type="text"
                    value={editTagValue}
                    onChange={(event) => setEditTagValue(event.target.value)}
                    onKeyDown={(event) => onUpdateTag(tag, event)}
                    onBlur={() => setIsEditingTag(null)}
                    aria-label={`Edit tag ${tag}`}
                    className="shop-field w-24 bg-transparent py-1 text-sm text-neutral-100"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onEditTag(tag)}
                    className="rounded-sm py-1 text-left text-neutral-300"
                  >
                    {tag}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="grid size-7 place-items-center rounded-sm text-neutral-500 hover:text-neutral-200"
                >
                  <X className="size-3" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectExistingTag(tag)}
                className="rounded-sm text-sm text-neutral-500 hover:text-neutral-200"
              >
                + {tag}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onAddNewTag}>
          <input
            type="text"
            value={newTagInput}
            onChange={(event) => setNewTagInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add a tag"
            aria-label="Add a tag"
            className="shop-field w-full bg-transparent py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
        </form>
      </div>
    </div>
  );
};

export default TagList;
