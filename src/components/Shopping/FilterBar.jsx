import React from 'react';
import clsx from 'clsx';

const FilterBar = ({
  showBoughtItems,
  setShowBoughtItems,
  allTags,
  selectedFilterTags,
  toggleFilterTag,
  boughtCount,
  hasItems
}) => {
  if (!hasItems) return null;

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-neutral-200">
          {showBoughtItems ? 'All items' : 'To buy'}
        </span>
        <button
          type="button"
          aria-pressed={showBoughtItems}
          onClick={() => setShowBoughtItems(!showBoughtItems)}
          className="rounded-sm text-neutral-500 hover:text-neutral-200"
        >
          {showBoughtItems ? 'Hide bought' : 'Show bought'}
        </button>
        {!showBoughtItems && boughtCount > 0 && (
          <span className="text-neutral-600">
            {boughtCount} bought
          </span>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {allTags.map((tag) => {
            const selected = selectedFilterTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleFilterTag(tag)}
                className={clsx(
                  'rounded-sm text-sm',
                  selected ? 'text-[#e4c9a3]' : 'text-neutral-500 hover:text-neutral-200'
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
